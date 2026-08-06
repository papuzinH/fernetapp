"use client";

import type { UseFormReturn } from "react-hook-form";
import type { MatchFormValues } from "@/lib/schemas/match";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { StepperInput } from "@/components/ui/stepper-input";

export interface StatsRowTarget {
  /** Índice dentro del field array `player_stats`. */
  index: number;
  nickname: string;
}

interface PlayerStatsRowsProps {
  form: UseFormReturn<MatchFormValues>;
  /** Solo los jugadores seleccionados, en el orden de la view. */
  rows: StatsRowTarget[];
}

const METRICS = [
  { key: "goals", label: "⚽ Goles", aria: "goles" },
  { key: "assists", label: "🎯 Asist.", aria: "asistencias" },
  { key: "yellow_cards", label: "🟨 Amar.", aria: "amarillas", max: 2 },
  { key: "red_cards", label: "🟥 Roja", aria: "rojas", max: 1 },
] as const;

/**
 * Las cuatro stats de cada jugador que jugó.
 *
 * Antes se renderizaba una fila por cada jugador del plantel, con las de los
 * que no jugaron en opacity-40 y los inputs deshabilitados: en un partido de
 * 9 sobre un plantel de 20 eran 44 casillas muertas en pantalla. Acá entran
 * solo los seleccionados, así que una sola grilla responde bien en los dos
 * tamaños y no hacen falta variantes desktop/mobile.
 */
export function PlayerStatsRows({ form, rows }: PlayerStatsRowsProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Marcá arriba quiénes jugaron para cargarles goles y asistencias.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(({ index, nickname }) => (
        <div key={index} className="rounded-lg border p-3">
          <p className="mb-3 font-semibold">{nickname}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {METRICS.map((metric) => (
              <FormField
                key={metric.key}
                control={form.control}
                name={`player_stats.${index}.${metric.key}`}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                    <FormControl>
                      <StepperInput
                        value={Number(field.value) || 0}
                        onChange={field.onChange}
                        label={`${metric.aria} de ${nickname}`}
                        min={0}
                        max={"max" in metric ? metric.max : undefined}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
