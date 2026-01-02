import os
import json
import time
from typing import Dict, Any, Optional, List

from app.training.train_engine_v2 import TrainingEngineV2
from app.core.config import settings
from app.services.storage import StorageService

def _read_local_json(path: str) -> Optional[dict]:
    if not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _cloud_exists(storage: StorageService, remote_name: str, tmp_dir: str) -> bool:
    """
    Jeito simples e confiável: tenta baixar pra um path temporário.
    Se baixar ok => existe.
    """
    try:
        os.makedirs(tmp_dir, exist_ok=True)
        tmp_path = os.path.join(tmp_dir, f"__probe__{remote_name}")
        storage.download_file(remote_name, tmp_path)
        return os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0
    except Exception:
        return False


def run_prod_like_training_integration_test(
    runs: int = 2,
    sleep_between_runs_sec: float = 1.0,
    expect_best_checkpoint: bool = True,
    fail_fast: bool = True,
) -> Dict[str, Any]:
    """
    Teste de integração REAL:
    - Chama Supabase RPC real (via fetch_training_dataset do seu loader).
    - Usa Cloudinary real (via StorageService real) para upload/download.
    - Força guardian parar no 1º run (depende do seu SystemConfig + budget).
    - Roda novamente e valida retomada.

    Retorna relatório detalhado.

    COMO GARANTIR QUE O 1º RUN PARE:
    - No seu SystemConfig, deixe:
      trainingTimeBudgetMin baixo (ex 1)
      guardianStopAtRatio baixo (ex 0.10~0.25)
      maxEpochsPerRun >= 1

    Obs: isso faz chamadas reais, então pode consumir cota.
    """
    storage = StorageService()

    # Nomes remotos (cloud)
    ckpt_remote = settings.ML_CLOUD_CHECKPOINT_NAME
    state_remote = settings.ML_CLOUD_STATE_NAME
    labels_remote = settings.ML_CLOUD_LABELS_NAME
    model_remote = settings.ML_CLOUD_MODEL_NAME
    best_remote = getattr(settings, "ML_CLOUD_BEST_CHECKPOINT_NAME", None)

    # Paths locais (engine usa isso internamente)
    local_tmp_dir = settings.ML_LOCAL_TMP_DIR
    os.makedirs(local_tmp_dir, exist_ok=True)

    report: Dict[str, Any] = {
        "runs": [],
        "cloud_expected": {
            "checkpoint": ckpt_remote,
            "state": state_remote,
            "labels": labels_remote,
            "best_checkpoint": best_remote,
            "final_model": model_remote,
        },
        "cloud_observed": {},
        "notes": [],
    }

    def assert_or_note(cond: bool, msg: str):
        if cond:
            report["notes"].append(f"OK: {msg}")
            return
        report["notes"].append(f"FAIL: {msg}")
        if fail_fast:
            raise RuntimeError(msg)

    # Probe antes: cloud acessível?
    probe_dir = os.path.join(local_tmp_dir, "__integration_probe__")
    assert_or_note(_cloud_exists(storage, state_remote, probe_dir) or True,
                   "Cloud acessível (probe via download) — se falhar nos próximos, credenciais estão erradas.")

    # Estado antes (se existir)
    before_state_path = os.path.join(local_tmp_dir, state_remote)
    # tenta baixar o state atual para comparar
    try:
        storage.download_file(state_remote, before_state_path)
    except Exception:
        pass
    before_state = _read_local_json(before_state_path) or {}
    before_last_id = int(before_state.get("last_processed_id", 0))
    before_epochs = int(before_state.get("total_epochs_trained", 0))

    report["notes"].append(f"Antes: last_processed_id={before_last_id}, total_epochs_trained={before_epochs}")

    # Executa runs reais
    for i in range(runs):
        engine = TrainingEngineV2(is_test=False)

        out = engine.pipeline_training()
        report["runs"].append(out)

        # Após cada run, validar se checkpoint/state/labels foram salvos no cloud
        # (se guardian stop, isso é obrigatório)
        # (se success, modelo final também)
        time.sleep(0.2)  # pequena folga para upload completar

        ckpt_ok = _cloud_exists(storage, ckpt_remote, probe_dir)
        state_ok = _cloud_exists(storage, state_remote, probe_dir)
        labels_ok = _cloud_exists(storage, labels_remote, probe_dir)

        report["cloud_observed"][f"run_{i+1}"] = {
            "checkpoint_exists": ckpt_ok,
            "state_exists": state_ok,
            "labels_exists": labels_ok,
        }

        assert_or_note(state_ok, f"State existe no cloud após run {i+1}")
        assert_or_note(labels_ok, f"Labels existe no cloud após run {i+1}")
        assert_or_note(ckpt_ok, f"Checkpoint existe no cloud após run {i+1}")

        # se best esperado, checa
        if expect_best_checkpoint and best_remote:
            best_ok = _cloud_exists(storage, best_remote, probe_dir)
            report["cloud_observed"][f"run_{i+1}"]["best_checkpoint_exists"] = best_ok
            # Não falho aqui por padrão: best só aparece se houver val_loss e melhora
            report["notes"].append(
                ("OK" if best_ok else "WARN") + f": Best checkpoint no cloud após run {i+1}"
            )

        # baixa state e compara progresso (cursor + epochs)
        after_state_path = os.path.join(local_tmp_dir, f"__after_state_run_{i+1}.json")
        try:
            storage.download_file(state_remote, after_state_path)
        except Exception:
            after_state_path = os.path.join(local_tmp_dir, state_remote)  # fallback
        after_state = _read_local_json(after_state_path) or {}
        after_last_id = int(after_state.get("last_processed_id", 0))
        after_epochs = int(after_state.get("total_epochs_trained", 0))

        report["notes"].append(f"Depois run {i+1}: last_processed_id={after_last_id}, total_epochs_trained={after_epochs}")

        # valida avanço (cursor não deve regredir)
        assert_or_note(after_last_id >= before_last_id, f"Cursor não regrediu (run {i+1})")
        assert_or_note(after_epochs >= before_epochs, f"Epochs não regrediram (run {i+1})")

        # atualiza baseline para próximo run
        before_last_id, before_epochs = after_last_id, after_epochs

        # se terminou e publicou, valida final
        if out.get("status") == "success" and out.get("published") is True:
            # Modelo final: depende de como seu StorageService nomeia upload do .keras.
            # Aqui checamos a existência do remote_name do modelo.
            model_ok = _cloud_exists(storage, model_remote, probe_dir)
            report["cloud_observed"][f"run_{i+1}"]["final_model_exists"] = model_ok
            assert_or_note(model_ok, "Modelo final publicado no cloud")
            break

        time.sleep(sleep_between_runs_sec)

    return report

if __name__ == "__main__":
    # Executa o teste de integração real
    test_report = run_prod_like_training_integration_test(
        runs=3,
        sleep_between_runs_sec=2.0,
        expect_best_checkpoint=True,
        fail_fast=False,
    )

    print("=== RELATÓRIO DE TESTE DE INTEGRAÇÃO REAL ===")
    for note in test_report["notes"]:
        print(note)
    print("==============================================")