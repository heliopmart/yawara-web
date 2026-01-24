import zod from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["application/pdf"];

export const psFileSchema = zod.object({
  file: zod
    .instanceof(File, { message: 'O arquivo é obrigatório.' })
    .refine((file) => file.size > 0, "O arquivo não pode estar vazio.")
    .refine((file) => file.size <= MAX_FILE_SIZE, "O tamanho do arquivo deve ser menor que 10MB.")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Formato de arquivo inválido. Apenas PDF é aceito."
    ),
});

export const psMetadataUploadSchema = zod.object({
  card_id: zod.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "card_id deve ser válido"
  })
})

export const updateNucleiChosenSchema = zod.object({
  nuclei_chosen: zod.array(zod.string())
    .min(1, "Deve escolher pelo menos um núcleo.")
    .max(2, "Pode escolher no máxmo dois núcleos."),
  edition_id: zod.string().uuid(),
  card_id: zod.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "card_id deve ser válido"
  })
})

export const updatePsEditionSchema = zod.object({
  is_active: zod.boolean().optional(),
  start_date: zod.string().datetime().optional(),
  finish_date: zod.string().datetime().optional(),
  final_result_doc: zod.string().optional(),
  is_completed: zod.boolean().optional()
})

export const updateCardUserSchema = zod.object({
  user_id: zod.string().uuid(),

  is_eligible: zod.boolean().optional(),
  is_waiting_result: zod.boolean().optional(),
  show_final_result: zod.boolean().optional(),
  nuclei_eligible: zod.array(zod.string()).optional(),
  is_accepted: zod.boolean().optional(),
  final_result_doc: zod.string().optional()
})

export const postPsEditionSchema = zod.object({
  name : zod.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  start_date : zod.string(),
  finish_date : zod.string(),
  registration_closing : zod.string(),
  cards_config : zod.array(
    zod.object({
      title: zod.string().min(1, "O título é obrigatório."),
      type: zod.enum(['DOCUMENT_SUBMISSION', 'PRESENCE_EVALUATION']),
      description: zod.string().optional(),
      state: zod.enum(['COMPLETED', 'FAILED', 'PENDING_ACTION', 'UNDER_REVIEW', 'NOT_AVAILABLE']),
      card_id: zod.number(),
      // optional fields for presence event
      start_time: zod.string().optional(),
      end_time: zod.string().optional(),
      location: zod.string().optional(),
      event_date: zod.string().optional(),
      // optional fields for document submission
      deadline: zod.string().optional(),
    })
  ).min(1, "Deve haver ao menos uma configuração de card.")
})

export const putUserPresenceSchema = zod.object({
  updates: zod.array(
    zod.object({
      user_card_id: zod.string().uuid(),
      card_id: zod.number(),
      is_presence: zod.boolean()
    })
  )
});

export const putUserScoreSchema = zod.object({
  updates: zod.array(
    zod.object({
      user_card_id: zod.string().uuid(),
      card_id: zod.number(),
      notes: zod.record(zod.string(), zod.number())
    })
  )
});

// TODO: Converter zod para interface, talvez uma refatoração futura seja necessária
// export type PutUserScoreInput = zod.infer<typeof putUserScoreSchema>;

export const uidSchema = zod.string().uuid()
