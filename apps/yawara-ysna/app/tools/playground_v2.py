import sys
import os
import asyncio

# Adiciona o diretório raiz ao path
sys.path.append(os.getcwd())

from app.ml.engine_v2 import NucleusRecommendationEngine
from app.schemas.candidate import CandidateInput
from app.schemas.historic import SubjectRecord

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

async def main():
    print("🧠 Inicializando Engine V2 (Neural)...")
    engine = NucleusRecommendationEngine()
    
    if not engine.model:
        print("❌ Modelo não carregado. Rode o treino primeiro!")
        return

    while True:
        print("\n" + "="*50)
        print("🧪 YAWARA NEURAL SANDBOX (AGORA COM CURSOS) 🧪")
        print("="*50)
        
        # --- SELEÇÃO DE CURSO ---
        print("Selecione o Curso do Candidato:")
        print("1 - Engenharia de Computação")
        print("2 - Engenharia Mecânica")
        print("3 - Engenharia de Energia")
        print("4 - Engenharia de Produção")
        print("5 - Outro")
        
        opt_course = input("Opção: ")
        course_map = {
            "1": "ENGENHARIA_COMPUTACAO",
            "2": "ENGENHARIA_MECANICA",
            "3": "ENGENHARIA_ENERGIA",
            "4": "ENGENHARIA_PRODUCAO",
            "5": "ENGENHARIA_OUTRO"
        }
        selected_course = course_map.get(opt_course, "ENGENHARIA_INDEFINIDA")
        print(f"Curso Selecionado: {selected_course}")
        print("-" * 30)

        # --- NOTAS ---
        print("Digite as notas (0-10). Enter para pular.")
        
        try:
            algo = input("Algoritmos: ")
            fisica = input("Física 1: ")
            calc = input("Cálculo 1: ")
            desenho = input("Desenho Técnico: ")
            
            algo_grade = float(algo) if algo else 0.0
            fisica_grade = float(fisica) if fisica else 0.0
            calc_grade = float(calc) if calc else 0.0
            desenho_grade = float(desenho) if desenho else 0.0
            
        except ValueError:
            print("❌ Números inválidos!")
            continue

        # Monta Histórico
        history = []
        if algo: history.append(SubjectRecord(name_raw="Algoritmos", subject_canonical="ALGORITMOS", grade=algo_grade, workload_hours=60, status="AP", code="X", period="X", type="X", absences=0, confidence=1))
        if fisica: history.append(SubjectRecord(name_raw="Fisica 1", subject_canonical="FISICA_1", grade=fisica_grade, workload_hours=60, status="AP", code="X", period="X", type="X", absences=0, confidence=1))
        if calc: history.append(SubjectRecord(name_raw="Calculo 1", subject_canonical="CALCULO_1", grade=calc_grade, workload_hours=80, status="AP", code="X", period="X", type="X", absences=0, confidence=1))
        if desenho: history.append(SubjectRecord(name_raw="Desenho", subject_canonical="DESENHO_TECNICO", grade=desenho_grade, workload_hours=60, status="AP", code="X", period="X", type="X", absences=0, confidence=1))

        # Monta Candidato com o curso escolhido
        candidate = CandidateInput(name="Tester", course=selected_course, semester=4, subjects=[])

        # Inferência
        print(f"\n🔮 Processando...")
        result = engine.predict(candidate, history)
        
        preds = result.get("predictions", {})
        print("\n📊 Probabilidades:")
        
        sorted_preds = sorted(preds.items(), key=lambda x: x[1]['score'], reverse=True)
        
        for nucleus, data in sorted_preds:
            score = data['score'] * 100
            bar = "█" * int(score / 5)
            status = "🔓" if data['status'] == "UNLOCKED" else "🔒"
            print(f"{nucleus[:25]:<25} | {score:5.1f}% {status} | {bar}")

        print("\nRecomendação:", result['recommended_nuclei'])
        
        if input("\nNovo teste? (s/n): ").lower() != 's':
            break

if __name__ == "__main__":
    asyncio.run(main())