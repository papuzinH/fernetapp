import { z } from "zod";

export const playerSchema = z.object({
  nickname: z
    .string()
    .min(2, "El apodo debe tener al menos 2 caracteres")
    .max(50, "El apodo no puede superar 50 caracteres"),
  full_name: z.string().max(100).optional().or(z.literal("")),
  position: z.enum(["ARQ", "DEF", "MED", "DEL"]).optional().nullable(),
  is_active: z.boolean().default(true),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;
