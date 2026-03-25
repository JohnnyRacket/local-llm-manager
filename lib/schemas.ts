import { z } from "zod"

export const instanceIdSchema = z.enum(["gpu", "cpu"])

export const instanceConfigSchema = z.object({
  id: instanceIdSchema,
  name: z.string().min(1),
  binaryPath: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  host: z.string().min(1),
  hfModel: z.string().min(1, "Model is required"),
  ngl: z.coerce.number().int().min(0).max(999),
  ctxSize: z.coerce.number().int().min(512),
  parallel: z.coerce.number().int().min(0).max(64),
  threads: z.coerce.number().int().min(0).max(256),
  temp: z.coerce.number().min(0).max(2),
  topP: z.coerce.number().min(0).max(1),
  topK: z.coerce.number().int().min(0).max(1000),
  repeatPenalty: z.coerce.number().min(0).max(2),
  cacheTypeK: z.string(),
  cacheTypeV: z.string(),
})

export type InstanceConfigInput = z.infer<typeof instanceConfigSchema>
