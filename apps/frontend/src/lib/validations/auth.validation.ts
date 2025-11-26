import zod from 'zod'

export const loginSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(6),
})

export const registreSchema = zod.object({
    name: zod.string().min(2),
    email: zod.string().email(),
    course: zod.string().min(2),
    password: zod.string().min(6),
})