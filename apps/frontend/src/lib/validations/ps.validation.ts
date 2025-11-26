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

export const uidSchema = zod.string().uuid()