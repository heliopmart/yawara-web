from app.utils.db import db_rpc

def check_entered_grades():
    """
    Verifica se há notas de participação lançadas no sistema.
    Retorna True se houver pelo menos 80% das notas lançadas, caso contrário False.
    """
    res = db_rpc(
        "get_team_engagement_stats"
    )

    return res['engagement_percentage'] > 80

