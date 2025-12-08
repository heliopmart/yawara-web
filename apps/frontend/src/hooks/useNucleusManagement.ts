import { useState, useEffect } from 'react';
import { SubjectWeight, CycleData } from '@yawara/types';

export const useNucleusManagement = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [nucleiId, setNucleiId] = useState<string>('');
    const [nucleiConfigId, setNucleiConfigId] = useState<string>('');
    const [psData, setPsData] = useState<CycleData | null>(null);
    const [vacancies, setVacancies] = useState<number>(0);
    const [subjects, setSubjects] = useState<SubjectWeight[]>([]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const res  = await fetch('/api/admin/nuclei', { method: 'GET' });
                const data = await res.json()

                if(!data.success){
                    throw data.error.message
                }
                
                setNucleiId(data.data.nuclei_configs[0].nuclei.id);
                setNucleiConfigId(data.data.nuclei_configs[0].id);
                setPsData({id: data.data.id, name: data.data.name});
                setVacancies(data.data.nuclei_configs[0].open_vacancies);
                setSubjects(data.data.nuclei_configs[0].nuclei_subject_weights.map((sw: any) => ({
                    id: sw.id,
                    subject_name: sw.subject_name,
                    weight: sw.weight
                })));
            } catch (error) {
                console.error('Erro ao carregar', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const addSubject = () => {
        setSubjects([...subjects, { subject_name: '', weight: 1 }]);
    };

    const removeSubject = (index: number) => {
        const newList = [...subjects];
        newList[index] = { ...newList[index], isDeleted: true };
        setSubjects(newList);
    };

    const updateSubject = (index: number, field: keyof SubjectWeight, value: any) => {
        const newList = [...subjects];
        newList[index] = { ...newList[index], [field]: value };
        setSubjects(newList);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (subjects.some(s => !s.subject_name.trim())) {
                throw 'Preencha o nome de todas as disciplinas.'
            }
        
            const res = await fetch('/api/admin/nuclei', {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
                nuclei_id: nucleiId,
                nuclei_config_id: nucleiConfigId,
                open_vacancies: vacancies,
                subject_weights: subjects
            })});
            const data = await res.json();

            
            if (!data.success) {
                throw data.error.message
            }

            if(data.data.config_id)
                setNucleiConfigId(data.data.config_id);
            
            if(data.data.subjects)
                setSubjects(data.data.subjects);
            
        } catch (error: any) {
            alert(error.message || 'Erro ao salvar a configuração.');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        psData,
        vacancies,
        setVacancies,
        subjects,
        addSubject,
        removeSubject,
        updateSubject,
        handleSave,
        isLoading,
        isSaving
    };
};