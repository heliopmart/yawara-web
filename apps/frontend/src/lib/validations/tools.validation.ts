import zod from 'zod'

export const updateToolsSchema = zod.object({
    id: zod.string().uuid().min(1, 'toolId inválido'),
    data: zod.object({
        name: zod.string().optional(),
        status: zod.enum(['AVAILABLE', 'ALLOCATED']).optional(),
        target: zod.string().optional(),
        quantity: zod.number().optional(),
        is_tool: zod.boolean().optional(),
        description: zod.string().optional()
    })
});

export const allocateToolSchema = zod.object({
    id: zod.string().uuid().min(1, 'toolId inválido')
});

export const deallocateToolSchema = zod.object({
    id: zod.string().uuid().min(1, 'toolId inválido'),
    quantity: zod.number().min(1, 'Quantidade inválida')
});

export const updateToolSetAllocationSchema = zod.object({
    id: zod.string().uuid().min(1, 'toolId inválido'),
    team_id: zod.string().uuid().min(1, 'team id inválido')
});

export const createToolSchema = zod.object({
    data: zod.object({
        name: zod.string().min(1, 'Nome da ferramenta é obrigatório'),
        target: zod.string().optional(),
        quantity: zod.number().optional(),
        is_tool: zod.boolean().optional(),
        description: zod.string().optional(),
    })
})
