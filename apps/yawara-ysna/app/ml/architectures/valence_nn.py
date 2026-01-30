import numpy as np
import pygad
import time
from typing import List, Dict, Tuple
from app.schemas.valence import CandidateProfile, ForgeOutput, ForgedSquad, SquadMember, SquadMetrics

class ValenceNN:
    def __init__(
        self, 
        candidates: List[CandidateProfile], 
        subject_weights: Dict[str, float], 
        team_size: int = 4
    ):
        self.team_size = team_size
        self.subject_weights_map = subject_weights
        self.subjects_list = list(subject_weights.keys())
        self.weights_vector = np.array(list(subject_weights.values()))
        
        limit = (len(candidates) // team_size) * team_size
        self._candidates = candidates[:limit]
        self._num_candidates = len(self._candidates)
        
        self._grade_matrix = np.zeros((self._num_candidates, len(self.subjects_list)))
        
        self._ig_scores = np.zeros(self._num_candidates)

        for idx, cand in enumerate(self._candidates):
            grade_map = {
                sub.subject_canonical: sub.grade 
                for sub in cand.academic_record 
                if sub.grade is not None and sub.subject_canonical in self.subject_weights_map
            }
            
            vec = [grade_map.get(sub_name, 0.0) for sub_name in self.subjects_list]
            self._grade_matrix[idx] = vec
            
            if cand.iron_gate_score and len(cand.iron_gate_score) > 0:
                self._ig_scores[idx] = np.mean(cand.iron_gate_score)
            else:
                self._ig_scores[idx] = 2.5

        self._W_COMPETENCY = 2.0    # Força Técnica
        self._W_BALANCE_IG = 10.0   # Equilíbrio de Nível (Iron Gate)
        self._W_BALANCE_PWR = 15.0  # Equilíbrio de Força Técnica
        self._W_SYNERGY = 5.0       # Diversidade de Semestre
        
        self.start_time = 0.0

    def forge(self) -> ForgeOutput:
        """ Executa o Algoritmo Genético """
        self.start_time = time.time()
        
        if self._num_candidates < self.team_size:
            return ForgeOutput(total_fitness=0, processing_time=0, squads=[])

        ga_instance = pygad.GA(
            num_generations=150,
            num_parents_mating=5,
            fitness_func=self._handle_fitness,
            sol_per_pop=60,
            num_genes=self._num_candidates,
            gene_type=float,
            init_range_low=0.0,
            init_range_high=1.0,
            mutation_percent_genes=15,
            suppress_warnings=True
        )

        ga_instance.run()

        solution, fitness, _ = ga_instance.best_solution()
        return self._handle_output_generation(solution, fitness)

    # ==========================================
    # LÓGICA PRIVADA
    # ==========================================

    def _handle_fitness(self, ga_instance, solution, solution_idx) -> float:
        chunks = self._get_squad_chunks(solution)
        
        teams_power_scores = []
        teams_ig_means = []
        total_fitness = 0.0
        
        for indices in chunks:
            # 1. Score Técnico (Best-in-Slot)
            metrics = self._compute_squad_metrics(indices)
            teams_power_scores.append(metrics['raw_score'])
            
            # 2. Score Iron Gate (Média do Time)
            team_ig = np.mean(self._ig_scores[indices])
            teams_ig_means.append(team_ig)
            
            # 3. Sinergia (Desvio Padrão de Semestre -> Queremos alto)
            semesters = [self._candidates[i].semester for i in indices]
            sem_std = np.std(semesters)
            
            # Soma local
            total_fitness += (metrics['raw_score'] * self._W_COMPETENCY) + (sem_std * self._W_SYNERGY)

        # Penalidades Globais (Fairness)
        # Queremos que todos os times tenham força similar
        if len(teams_power_scores) > 1:
            pwr_imbalance = np.std(teams_power_scores)
            ig_imbalance = np.std(teams_ig_means)
            
            total_fitness -= (pwr_imbalance * self._W_BALANCE_PWR)
            total_fitness -= (ig_imbalance * self._W_BALANCE_IG)
            
        return total_fitness

    def _compute_squad_metrics(self, member_indices: List[int]) -> Dict:
        """
        Coração Matemático: Calcula o 'Best-in-Slot' do time.
        """
        # Pega as notas apenas dos membros desse time
        squad_grades = self._grade_matrix[member_indices]
        
        # Best-in-Slot: A maior nota do grupo em cada matéria prevalece
        squad_best_vec = np.max(squad_grades, axis=0)
        
        # Produto Escalar com os pesos das matérias
        raw_score = np.sum(squad_best_vec * self.weights_vector)
        
        return {
            "raw_score": raw_score,
            "best_vec": squad_best_vec
        }

    def _get_squad_chunks(self, solution: List[float]) -> List[List[int]]:
        priority_indices = np.argsort(solution)
        chunks = [priority_indices[i:i + self.team_size] 
                 for i in range(0, len(priority_indices), self.team_size)]
        return [c for c in chunks if len(c) == self.team_size]

    def _handle_output_generation(self, solution, fitness) -> ForgeOutput:
        chunks = self._get_squad_chunks(solution)
        forged_squads = []

        for i, indices in enumerate(chunks):
            math_data = self._compute_squad_metrics(indices)
            best_vec = math_data["best_vec"]
            
            # Identifica Pontos Fortes (> 6.0) e Gaps (< 5.0 em matérias críticas)
            top_indices = np.argsort(best_vec)[::-1][:5]
            strengths = [self.subjects_list[k] for k in top_indices if best_vec[k] > 6.0]
            
            # Assume que peso >= 2.5 é matéria crítica
            weights = self.weights_vector
            gap_indices = [k for k, val in enumerate(best_vec) if val < 5.0 and weights[k] >= 2.5]
            gaps = [self.subjects_list[k] for k in gap_indices]

            # Monta Membros
            members_objs = []
            for idx in indices:
                cand = self._candidates[idx]
                members_objs.append(SquadMember(
                    id=cand.id,
                    name=cand.name,
                    role_focus=f"Semestre {cand.semester}"
                ))

            # Monta Métricas do Time
            squad_ig_mean = np.mean(self._ig_scores[indices])
            metrics = SquadMetrics(
                power_score=round(math_data["raw_score"], 2),
                diversity_score=round(float(np.std([self._candidates[x].semester for x in indices])), 2),
                iron_gate_mean=round(float(squad_ig_mean), 2),
                top_competencies=strengths,
                critical_gaps=gaps
            )

            forged_squads.append(ForgedSquad(
                squad_name=f"Squad Alpha-{i+1}",
                metrics=metrics,
                members=members_objs
            ))

        return ForgeOutput(
            total_fitness=fitness,
            processing_time=time.time() - self.start_time,
            squads=forged_squads
        )