import zod from 'zod';

export const updateMyAccountUserDataSchema = zod.object({
    name: zod.string().min(3, 'O nome deve ter no mínimo 3 caracteres').max(100, 'O nome deve ter no máximo 100 caracteres').optional(),
    phone: zod.string().min(9, 'O telefone deve ter no mínimo 10 caracteres').max(15, 'O telefone deve ter no máximo 15 caracteres').nullable().optional(),
    wpa_enabled: zod.boolean().default(false).optional(),
    wpa_subscription: zod.object({
        endpoint: zod.string(),
        expirationTime: zod.number().nullable().optional(),
        keys: zod.object({
            p256dh: zod.string(),
            auth: zod.string(),
        }).optional()
    }).nullable().optional()
})