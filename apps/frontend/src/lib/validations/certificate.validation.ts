import zod from 'zod'

export const postCertificateSchema = zod.object({
    student_name: zod.string().min(2, "O nome do estudante deve ter pelo menos 2 caracteres."),
    course_name: zod.string().min(2, "O nome do curso deve ter pelo menos 2 caracteres."),
    hours: zod.number().min(1, "A carga horária deve ser no mínimo 1 hora."),
    cpf: zod.string().min(11, "O CPF deve ter pelo menos 11 caracteres."),
})

