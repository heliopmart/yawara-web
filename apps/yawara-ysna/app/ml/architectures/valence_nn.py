import numpy as np
import pygad
import time
from typing import List, Dict
from app.schemas.valence import CandidateProfile, ForgeOutput, ForgedSquad, SquadMember, SquadMetrics

class ValenceModel:
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
        
        self._candidates = candidates
        self._num_candidates = len(self._candidates)
        
        # --- PREPARAÇÃO DAS MATRIZES ---
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

        # Pesos
        self._W_COMPETENCY = 2.0
        self._W_BALANCE_IG = 10.0
        self._W_BALANCE_PWR = 15.0
        self._W_SYNERGY = 5.0
        
        self.start_time = 0.0

    def forge(self) -> ForgeOutput:
        self.start_time = time.time()
        
        if self._num_candidates <= self.team_size:
            return self._create_single_squad_result()

        # Se temos gente suficiente, roda o Algoritmo Genético
        ga_instance = pygad.GA(
            num_generations=150,
            num_parents_mating=max(2, self._num_candidates // 4),
            fitness_func=self._handle_fitness,
            sol_per_pop=50,
            num_genes=self._num_candidates,
            gene_type=float,
            init_range_low=0.0,
            init_range_high=1.0,
            mutation_percent_genes=20, # Mutação maior para pequenos grupos
            suppress_warnings=True
        )

        ga_instance.run()

        solution, fitness, _ = ga_instance.best_solution()
        return self._handle_output_generation(solution, fitness)

    # ==========================================
    # LÓGICA PRIVADA
    # ==========================================

    def _create_single_squad_result(self) -> ForgeOutput:
        """Cria um único time com todos os candidatos disponíveis (Modo Sobrevivência)"""
        all_indices = list(range(self._num_candidates))
        
        math_data = self._compute_squad_metrics(all_indices)
        
        best_vec = math_data["best_vec"]
        top_indices = np.argsort(best_vec)[::-1][:5]
        strengths = [self.subjects_list[k] for k in top_indices if best_vec[k] > 5.0]
        
        members_objs = [
            SquadMember(id=c.id, name=c.name, role_focus=f"Semestre {c.semester}")
            for c in self._candidates
        ]

        squad = ForgedSquad(
            squad_name="Squad Alpha (Único)",
            metrics=SquadMetrics(
                power_score=round(math_data['raw_score'], 2),
                diversity_score=0.0, # Irrelevante para time único
                iron_gate_mean=round(float(np.mean(self._ig_scores)), 2),
                top_competencies=strengths,
                critical_gaps=[]
            ),
            members=members_objs
        )

        return ForgeOutput(
            total_fitness=100.0,
            processing_time=time.time() - self.start_time,
            squads=[squad]
        )

    def _handle_fitness(self, ga_instance, solution, solution_idx) -> float:
        chunks = self._get_adaptive_chunks(solution)
        
        teams_power = []
        total_fitness = 0.0
        
        for indices in chunks:
            # Penaliza times muito pequenos (< 2 pessoas) a menos que seja inevitável
            size_penalty = 0
            if len(indices) < 2: 
                size_penalty = -500.0 

            metrics = self._compute_squad_metrics(indices)
            teams_power.append(metrics['raw_score'])
            
            semesters = [self._candidates[i].semester for i in indices]
            sem_std = np.std(semesters) if len(semesters) > 1 else 0
            
            total_fitness += (metrics['raw_score'] * self._W_COMPETENCY) + (sem_std * self._W_SYNERGY) + size_penalty

        # Penalidade de Desequilíbrio (Só se tiver mais de 1 time)
        if len(teams_power) > 1:
            imbalance = np.std(teams_power)
            total_fitness -= (imbalance * self._W_BALANCE_PWR)
            
        return total_fitness

    def _compute_squad_metrics(self, member_indices: List[int]) -> Dict:
        squad_grades = self._grade_matrix[member_indices]
        
        # Se for só 1 pessoa, o max axis=0 funciona igual (retorna a própria linha)
        if len(member_indices) == 1:
            squad_best_vec = squad_grades[0]
        else:
            squad_best_vec = np.max(squad_grades, axis=0)
        
        raw_score = np.sum(squad_best_vec * self.weights_vector)
        return {"raw_score": raw_score, "best_vec": squad_best_vec}

    def _get_adaptive_chunks(self, solution: List[float]) -> List[List[int]]:
        """
        Divide a população. Se sobrar gente, cria um último time menor.
        Ex: 6 pessoas, time de 4 -> [4, 2]
        """
        priority_indices = np.argsort(solution)
        chunks = []
        
        for i in range(0, len(priority_indices), self.team_size):
            chunk = priority_indices[i:i + self.team_size]
            chunks.append(chunk.tolist()) 
            
        return chunks

    def _handle_output_generation(self, solution, fitness) -> ForgeOutput:
        chunks = self._get_adaptive_chunks(solution)
        forged_squads = []

        for i, indices in enumerate(chunks):
            math_data = self._compute_squad_metrics(indices)
            best_vec = math_data["best_vec"]
            
            top_indices = np.argsort(best_vec)[::-1][:5]
            strengths = [self.subjects_list[k] for k in top_indices if best_vec[k] > 6.0]
            
            gap_indices = [k for k, val in enumerate(best_vec) if val < 5.0 and self.weights_vector[k] >= 2.5]
            gaps = [self.subjects_list[k] for k in gap_indices]

            members_objs = []
            for idx in indices:
                cand = self._candidates[idx]
                members_objs.append(SquadMember(
                    id=cand.id,
                    name=cand.name,
                    role_focus=f"Semestre {cand.semester}"
                ))

            team_suffix = f"Alpha-{i+1}"
            if len(indices) < self.team_size:
                team_suffix = f"Omega (Apoio - {len(indices)})"

            metrics = SquadMetrics(
                power_score=round(math_data["raw_score"], 2),
                diversity_score=round(float(np.std([self._candidates[x].semester for x in indices])), 2) if len(indices)>1 else 0.0,
                iron_gate_mean=round(float(np.mean(self._ig_scores[indices])), 2),
                top_competencies=strengths,
                critical_gaps=gaps
            )

            forged_squads.append(ForgedSquad(
                squad_name=f"Squad {team_suffix}",
                metrics=metrics,
                members=members_objs
            ))

        return ForgeOutput(
            total_fitness=fitness,
            processing_time=time.time() - self.start_time,
            squads=forged_squads
        )