import zod from 'zod'

export const updateNucleiConfigSchema = zod.object({    
    nuclei_id: zod.string().uuid(),
    nuclei_config_id: zod.string().uuid().optional(),
    open_vacancies: zod.number().min(0, 'O número de vagas deve ser pelo menos 0.'),
    subject_weights: zod.array(
        zod.object({
            id: zod.string().uuid().optional(),
            subject_name: zod.string().min(1, 'O nome da disciplina é obrigatório.'),
            weight: zod.number().min(1, 'O peso deve ser pelo menos 1.').max(5, 'O peso deve ser no máximo 5.'),
            isDeleted: zod.boolean().optional()
        })
    ).min(1, 'Deve haver pelo menos uma disciplina.')
})

export const createNucleusSchema = zod.object({
    name: zod.string().min(1, 'O nome do núcleo é obrigatório.'),
    leader_id: zod.string().uuid('ID do líder deve ser um UUID válido.')
})

export const nucleiUuidParamSchema = zod.string().uuid()