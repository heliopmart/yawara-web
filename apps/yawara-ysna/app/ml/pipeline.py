# Orquestrador de treino/inferência


from app.services.system_configs import get_active_config

from app.utils.db import db_select

from app.ml.engine_v1 import EngineV1
from app.ml.engine_v2 import EngineV2

class SelectionPipeline:
    def __init__(self):
        self.config = get_active_config()
        self.engine_v1 = EngineV1()
        self.engine_v2 = EngineV2()

    def get_count_completed_ps(self):
        # res = supabase.table("SelectionProcess").select("id", count="exact").eq("status", "COMPLETED").execute()
        res = db_select("ps_editions", 'id', [{'is_active':'false'}], True)
        return res.count or 0

    def evaluate_candidate(self, candidate_data):
        mode = self.config.engineMode
        
        # Lógica do "Maestro"
        use_neural = False
        
        if mode == "V2":
            use_neural = True
        elif mode == "V1":
            use_neural = False
        elif mode == "AUTO":
            ps_count = self.get_count_completed_ps()
            if ps_count >= self.config.minCyclesForNeural:
                use_neural = True
            else:
                print(f"ℹ️ Modo AUTO: {ps_count}/{self.config.minCyclesForNeural} ciclos. Usando V1.")

        # Execução
        if use_neural:
            try:
                print("🧠 Usando Engine V2 (Neural)...")
                return self.engine_v2.predict(candidate_data)
            except Exception as e:
                print(f"🚨 Falha na V2: {e}. Fazendo Fallback para V1.")
                return self.engine_v1.calculate(candidate_data)
        else:
            print("📐 Usando Engine V1 (Determinística)...")
            return self.engine_v1.calculate(candidate_data)