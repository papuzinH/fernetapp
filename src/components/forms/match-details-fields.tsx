"use client";

import type { UseFormReturn } from "react-hook-form";
import type { MatchFormValues } from "@/lib/schemas/match";
import type { Tournament } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface MatchDetailsFieldsProps {
  form: UseFormReturn<MatchFormValues>;
  tournaments: Tournament[];
  matchStatus: "scheduled" | "completed";
  /** Suma de los goles individuales, para el aviso de diferencia. */
  totalPlayerGoals: number;
  /** True si el marcador se editó a mano y dejó de seguir a la suma. */
  goalsForTouched: boolean;
  /** Recibe el texto crudo del input: vaciarlo vuelve a acoplar la suma. */
  onGoalsForManualChange: (rawValue: string) => void;
}

/** Sección A del form: qué partido fue y cómo salió. */
export function MatchDetailsFields({
  form,
  tournaments,
  matchStatus,
  totalPlayerGoals,
  goalsForTouched,
  onGoalsForManualChange,
}: MatchDetailsFieldsProps) {
  const goalsFor = form.watch("goals_for");
  const goalsAgainst = form.watch("goals_against");

  const gf = Number(goalsFor) || 0;
  const ga = Number(goalsAgainst) || 0;
  const result =
    gf > ga
      ? { label: "VICTORIA", color: "bg-green-100 text-green-800" }
      : gf === ga
        ? { label: "EMPATE", color: "bg-yellow-100 text-yellow-800" }
        : { label: "DERROTA", color: "bg-red-100 text-red-800" };

  // Solo tiene sentido avisar de la diferencia cuando el marcador se
  // desacopló: mientras sigue a la suma, no puede discrepar.
  const goalsMismatch =
    goalsForTouched && totalPlayerGoals > 0 && totalPlayerGoals !== gf;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tournament_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Torneo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar torneo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="opponent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rival</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Scarlett FC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {matchStatus === "scheduled" && (
        <div className="grid gap-4 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-blue-800 dark:bg-blue-950/20">
          <FormField
            control={form.control}
            name="datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y Hora</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugar</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Cancha Diaz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Av. San Martín 1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {matchStatus === "completed" && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <FormField
              control={form.control}
              name="goals_for"
              render={({ field }) => (
                <FormItem className="w-28">
                  <FormLabel>Goles FCG</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="text-center text-lg font-bold"
                      {...field}
                      onChange={(e) => {
                        onGoalsForManualChange(e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pb-2 text-xl font-bold text-muted-foreground">—</div>
            <FormField
              control={form.control}
              name="goals_against"
              render={({ field }) => (
                <FormItem className="w-28">
                  <FormLabel>Goles Rival</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="text-center text-lg font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Badge className={`mb-2 ${result.color}`}>
              {result.label} {gf}-{ga}
            </Badge>
          </div>

          {!goalsForTouched && (
            <p className="text-xs text-muted-foreground">
              El marcador se completa solo con los goles de cada jugador.
              Editalo si hubo un gol en contra o no sabés quién lo hizo.
            </p>
          )}
          {goalsMismatch && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ Goles individuales ({totalPlayerGoals}) ≠ Goles del equipo ({gf})
            </Badge>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="yellow_cards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🟨 Amarillas</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="red_cards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🟥 Rojas</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Video (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pitch_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Cancha ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Ej: 25000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: No se presentaron, suspendido por lluvia..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
