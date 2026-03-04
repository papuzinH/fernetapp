import { z } from "zod";

export const tournamentSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre del torneo debe tener al menos 2 caracteres")
    .max(100, "Nombre demasiado largo"),
  year: z
    .number()
    .int()
    .min(2017, "El año mínimo es 2017")
    .max(new Date().getFullYear() + 1, "Año inválido"),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type TournamentFormValues = z.infer<typeof tournamentSchema>;
