import { z } from "zod";

// Schema para las stats de un jugador individual en un partido
export const playerMatchStatSchema = z.object({
  player_id: z.string().uuid("ID de jugador inválido"),
  nickname: z.string(), // Para mostrar en el formulario, no se envía al server
  played: z.boolean().default(false),
  goals: z.coerce.number().int().min(0, "Los goles no pueden ser negativos").default(0),
  assists: z.coerce.number().int().min(0, "Las asistencias no pueden ser negativas").default(0),
  yellow_cards: z.coerce.number().int().min(0).max(2, "Máximo 2 amarillas por partido").default(0),
  red_cards: z.coerce.number().int().min(0).max(1, "Máximo 1 roja por partido").default(0),
});

// Regex para detectar resultados malformateados como fechas (ej: "03/02" en vez de "3-2")
const DATE_LIKE_PATTERN = /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/;

// Schema del partido completo
export const matchSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  tournament_id: z.string().uuid("Seleccioná un torneo"),
  opponent: z
    .string()
    .min(2, "El nombre del rival debe tener al menos 2 caracteres")
    .max(100, "Nombre del rival demasiado largo")
    .refine(
      (val) => !DATE_LIKE_PATTERN.test(val),
      "Eso parece una fecha, no el nombre de un equipo"
    ),
  goals_for: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los goles no pueden ser negativos")
    .max(99, "¿99 goles? Revisá el dato"),
  goals_against: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(0, "Los goles no pueden ser negativos")
    .max(99, "¿99 goles? Revisá el dato"),
  yellow_cards: z.coerce.number().int().min(0).default(0),
  red_cards: z.coerce.number().int().min(0).default(0),
  video_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  player_stats: z.array(playerMatchStatSchema).optional(),
});

export type MatchFormValues = z.infer<typeof matchSchema>;
export type PlayerMatchStatValues = z.infer<typeof playerMatchStatSchema>;
