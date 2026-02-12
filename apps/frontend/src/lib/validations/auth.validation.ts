import zod from 'zod'
import {COURSE_MOCK} from "@/mocks/register.mock";
export const regexStudentEmail = /^[a-z]+\.[a-z]+\d+@academico\.ufgd\.edu\.br$/;
export const regexTeacherEmail = /^[a-z]+@ufgd\.edu\.br$/;

const BANNED_PASSWORDS = ['123456', 'password', 'qwerty', 'yawara2024'];

const emailValidation = zod.string()
    .email("E-mail inválido")
    .refine((email) => regexStudentEmail.test(email) || regexTeacherEmail.test(email), {
        message: "O e-mail deve ser institucional (@ufgd.edu.br ou @academico.ufgd.edu.br)"
    });

const strongPassword = zod.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .refine((pass) => !BANNED_PASSWORDS.includes(pass.toLowerCase()), {
        message: "Senha muito fraca. Escolha algo mais complexo."
    })
    .refine((pass) => /[0-9]/.test(pass), "A senha deve conter pelo menos um número");

export const loginSchema = zod.object({
    email: emailValidation,
    password: strongPassword,
})

export const sendResetPasswordSchema = zod.object({
    email: emailValidation,
})

export const resetPasswordSchema = zod.object({
    email: emailValidation,
    password: strongPassword,
    hash: zod.string().min(1, "Hash é obrigatório"),
})

export const registreSchema = zod.object({
    name: zod.string().min(2),
    email: emailValidation,
    course: zod.string().refine((val) => COURSE_MOCK.includes(val), {
        message: "Por favor, selecione um curso válido da UFGD."
    }),
    yearOfEntry: zod.number().refine((val) => val >= 2000 && val <= new Date().getFullYear(), {
        message: "Ano de ingresso inválido."
    }),
    password: strongPassword,
    wpa_enabled: zod.boolean().default(false).optional(),
    wpa_subscription: zod.object({
        endpoint: zod.string(),
        expirationTime: zod.number().nullable(),
        keys: zod.object({
            p256dh: zod.string(),
            auth: zod.string(),
        })
    }).optional()
})

export const ALLOWED_ROLES = ['ADMIN', 'LEADER', 'MODERATOR'];

export function verifyEmail(email: string): "docente" | "discente" | false {
    if(regexStudentEmail.test(email)) return "discente";
    if(regexTeacherEmail.test(email)) return "docente";
    return false;
}