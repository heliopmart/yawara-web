import zod, { file } from 'zod'

export const userIdSchema = zod.object({
    team_id: zod.string().uuid().min(1)
})

export const artIdSchema = zod.object({
    id: zod.string().uuid().min(1)
})

export const userNotesSchema = zod.object({
    team_id: zod.string().uuid().min(1),
    n_social: zod.object({
        participation: zod.number().min(0).max(10),
        proactivity: zod.number().min(0).max(10),
    }),
    n_tech: zod.object({
        reports: zod.number().min(0).max(10),
        delivery: zod.number().min(0).max(10),
    })
})

export const createArtSchema = zod.object({
    title: zod.string().min(1).max(100),
    description: zod.string().min(1).max(500),
    members: zod.array(zod.string().uuid().min(1)).min(1)
})

export const createArttcSchema = zod.object({
    title: zod.string().min(1).max(100),
    art_id: zod.string().uuid().min(1),
    members: zod.array(zod.string().uuid().min(1)).min(1)
})

export const uploadReportArt = zod.object({
    id: zod.string().uuid().min(1),
    file: zod.instanceof(File)
})