from typing import List, Dict, Set
from datetime import datetime
import hashlib
import asyncio
import logging
from app.schemas.valence import CandidateProfile, ForgeOutput, AllocationCandidateInput
from app.schemas.historic import AcademicRecord
from app.ml.architectures.valence_nn import ValenceModel
from app.services.selection_data import SelectionDataService
from app.services.html_report_service import HTMLReportService
from app.services.ingestion import ingest_academic_record_from_pdf
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

class ValenceEngine:
    def __init__(self, max_concurrent_tasks: int = 3):
        self.data_service = SelectionDataService()
        self.report_service = HTMLReportService()
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)

    async def run_allocation_pipeline(self,team_size: int = 4) -> bytes:
        """
        Executa todo o fluxo: Fetch -> Normalize -> Forge -> Export PDF
        Retorna: Bytes do PDF gerado.
        """
        
        ps_config_id = self.data_service.get_ps_edition_active()
        candidates = self.data_service.get_iron_gate_approved_candidate_data()        

        if(ps_config_id is None):
            logger.info("Nenhum processo seletivo ativo encontrado.")
            return

        total = len(candidates)
        if total == 0:
            logger.info("Fila vazia.")
            return

        tasks = [
            self._bounded_process(task, ps_config_id)
            for task in candidates
        ]
        
        academic_records = await asyncio.gather(*tasks, return_exceptions=True)
        
        profiles: List[CandidateProfile] = []
        for raw_cand, academic_record in zip(candidates, academic_records):
    
            if isinstance(academic_record, Exception) or academic_record is None:
                print(f"⚠️ Falha ao baixar histórico de {raw_cand.id}. Erro: {academic_record}")
                continue
            
            try:        
                clean_grades = academic_record.subjects
                
                profiles.append(CandidateProfile(
                    id=str(raw_cand.id),
                    name=raw_cand.name, 
                    semester=raw_cand.semester,
                    academic_record=clean_grades,
                    iron_gate_score=raw_cand.iron_gate_notes 
                ))

            except Exception as e:
                print(f"❌ Erro processando dados do candidato {raw_cand.id}: {e}")
                continue
        
        # if len(profiles) < team_size:
        #     raise ValueError(f"Apenas {len(profiles)} candidatos válidos processados. Mínimo necessário: {team_size}")

        known_subject_weights = self._build_dynamic_knowledge_base(profiles)

        engine = ValenceModel(
            candidates=profiles,
            subject_weights=known_subject_weights,
            team_size=team_size
        )
        
        forge_result: ForgeOutput = engine.forge()
        
        pdf_bytes = self._generate_xai_pdf(forge_result)
        
        return pdf_bytes
    
    def _build_dynamic_knowledge_base(self, profiles: List[CandidateProfile]) -> Dict[str, float]:
        """
        Constrói o mapa de pesos dinamicamente.
        Regra:
        1. Varre todas as matérias presentes nos perfis (SubjectRecord.subject_canonical).
        2. Se a matéria existe em REFERENCE_WEIGHTS, usa aquele peso.
        3. Se não existe (é nova/desconhecida), usa peso neutro (1.0).
        """
        dynamic_weights: Dict[str, float] = {}
        
        all_subjects: Set[str] = set()
        for p in profiles:
            for sub in p.academic_record:
                if sub.grade is not None and sub.subject_canonical:
                     all_subjects.add(sub.subject_canonical)

        for subject in all_subjects:
            dynamic_weights[subject] = 1.0

        return dynamic_weights

    def _generate_xai_pdf(self, forge_result: ForgeOutput) -> bytes:
        """
        Docstring para _generate_xai_pdf
        
        :param forge_result: Resultado da forja dos times
        :type forge_result: ForgeOutput
        :return: PDF em bytes
        :rtype: bytes
        """
        run_hash = hashlib.md5(str(forge_result.total_fitness).encode()).hexdigest()[:8].upper()

        bundle = {
            "title": "Processo Seletivo Yawara",
            "date": datetime.now().strftime("%d/%m/%Y às %H:%M"),
            "hash": f"#{run_hash}",
            "squads": forge_result.squads 
        }

        return self.report_service.generate_valence_pdf_bytes(
            bundle=bundle
        )

    async def _bounded_process(self, task, edition_id):
        async with self.semaphore:
           result = await self._download_historic_pdf(task, edition_id)
           return result

    async def _download_historic_pdf(self, task: AllocationCandidateInput, edition_id: str) -> AcademicRecord:
        """
        Realiza o trabalho pesado comum (I/O) e chama o método de avaliação específico.
        """
        try:
            
            candidate_id = task.id
            file_id = task.historic_id


            if not file_id:
                logger.warning(f"candidate {candidate_id} sem arquivo associado.")
                return None

            pdf_bytes = storage_service.get_file_bytes(file_id)

            if not pdf_bytes:
                return None

            record = await ingest_academic_record_from_pdf(pdf_bytes, candidate_id=candidate_id, cycle_id=edition_id) 

            if not record:
                return None
            
            return record
        except Exception as e:
            logger.error(f"Erro ao processar histórico do usuário {candidate_id}: {str(e)}")
            return None