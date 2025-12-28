from typing import List, Dict, Any
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord
import json

from app.utils.db import db_rpc

def fetch_training_dataset() -> List[Dict[str, Any]]:
    """
    [TO-DO: IMPLEMENTAR CONEXÃO COM BANCO]
    
    Busca o histórico de membros passados para treinar a rede.
    
    Deve retornar uma lista onde cada item é um dicionário no formato:
    {
        "course": "ENGENHARIA_COMPUTACAO",
        "semester_at_entry": 4,
        "academic_history": [
            {"name": "ALGORITMOS", "grade": 9.5, "workload": 60},
            ...
        ],
        "outcomes": [
            {
                "nucleus": "NÚCLEO DE SISTEMAS EMBARCADOS", # Deve bater com ALL_NUCLEI
                "status": 1, # 1=Ativo/Sucesso, 0=Desistente/Falha
                "tech": {"delivery": 10, "reports": 5},
                "social": {"proatividade": 9.0, "participacao": 8.0}
            },
            ...
        ]
    }
    """

    res = db_rpc("get_training_dataset_v2")
    if res is None:
        return []
    
    return res


# --- CONTRATO PARA A INFERÊNCIA (PROCESSAMENTO EM MASSA) ---

def fetch_candidates_for_classification(process_id: str) -> List[Dict[str, Any]]:
    """
    [TO-DO: IMPLEMENTAR CONEXÃO COM BANCO]
    
    Busca todos os candidatos de um processo seletivo específico.
    
    Deve retornar uma lista de dicionários contendo o Objeto Candidate e sua Lista de Histórico:
    [
        {
            "candidate_id": "uuid-do-banco",
            "candidate_obj": CandidateInput(...), 
            "history_list": [SubjectRecord(...), SubjectRecord(...)]
        },
        ...
    ]
    """
    raise NotImplementedError("Hélio, conecte o BD aqui para buscar os candidatos.")

def save_classification_result(candidate_id: str, predictions: Dict[str, Any]):
    """
    [TO-DO: IMPLEMENTAR CONEXÃO COM BANCO]
    
    Salva o resultado da Engine 2 no banco de dados para esse candidato.
    Ex: Atualiza a tabela 'candidates' ou insere em 'classification_results'.
    """
    print(f"[DB MOCK] Salvando resultados para {candidate_id}: {predictions}")
    # db.execute("UPDATE candidates SET ia_recommendations = %s WHERE id = %s", (json.dumps(predictions), candidate_id))
    pass

if __name__ == "__main__":
    # Teste rápido da função de fetch de treinamento
    dataset = fetch_training_dataset()
    print(json.dumps(dataset, indent=2))