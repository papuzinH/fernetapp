"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { matchSchema, type MatchFormValues } from "@/lib/schemas/match";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMatch, updateMatch } from "@/app/admin/matches/actions";
import type { Match, MatchPlayerStats, Tournament } from "@/lib/supabase/types";
import { useEffect, useMemo, useState } from "react";
import { MatchDetailsFields } from "@/components/forms/match-details-fields";
import { RosterPicker, type SelectablePlayer } from "@/components/forms/roster-picker";
import { PlayerStatsRows } from "@/components/forms/player-stats-rows";
import { SaveWarningsDialog } from "@/components/forms/save-warnings-dialog";

/** Pago existente del partido, para advertir si se toca uno ya saldado. */
export interface ExistingPayment {
  player_id: string;
  amount: number;
  status: string;
}

interface MatchFormProps {
  tournaments: Tournament[];
  /** Ya ordenados por apariciones recientes (v_player_selection_order). */
  players: SelectablePlayer[];
  existingMatch?: Match;
  existingStats?: MatchPlayerStats[];
  existingPayments?: ExistingPayment[];
}

export function MatchForm({
  tournaments,
  players,
  existingMatch,
  existingStats,
  existingPayments = [],
}: MatchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalsForTouched, setGoalsForTouched] = useState(!!existingMatch);
  const [pendingWarnings, setPendingWarnings] = useState<string[] | null>(null);
  const isEditing = !!existingMatch;

  const defaultPlayerStats = players.map((p) => {
    const existing = existingStats?.find((s) => s.player_id === p.player_id);
    return {
      player_id: p.player_id,
      nickname: p.nickname,
      played: existing?.played ?? false,
      goals: existing?.goals ?? 0,
      assists: existing?.assists ?? 0,
      yellow_cards: existing?.yellow_cards ?? 0,
      red_cards: existing?.red_cards ?? 0,
    };
  });

  const form = useForm<MatchFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(matchSchema) as any,
    defaultValues: {
      date: existingMatch?.date ?? "",
      tournament_id: existingMatch?.tournament_id ?? "",
      opponent: existingMatch?.opponent ?? "",
      goals_for: existingMatch?.goals_for ?? 0,
      goals_against: existingMatch?.goals_against ?? 0,
      yellow_cards: existingMatch?.yellow_cards ?? 0,
      red_cards: existingMatch?.red_cards ?? 0,
      video_url: existingMatch?.video_url ?? "",
      notes: existingMatch?.notes ?? "",
      status: existingMatch?.status ?? "completed",
      location_name: existingMatch?.location_name ?? "",
      location_address: existingMatch?.location_address ?? "",
      datetime: existingMatch?.datetime ?? "",
      pitch_price: existingMatch?.pitch_price ?? undefined,
      player_stats: defaultPlayerStats,
    },
  });

  useFieldArray({ control: form.control, name: "player_stats" });

  const playerStats = form.watch("player_stats");
  const matchStatus = form.watch("status");

  const selectedIds = useMemo(
    () => (playerStats ?? []).filter((ps) => ps.played).map((ps) => ps.player_id),
    [playerStats]
  );

  const statsRows = useMemo(
    () =>
      (playerStats ?? [])
        .map((ps, index) => ({ index, nickname: ps.nickname, played: ps.played }))
        .filter((row) => row.played),
    [playerStats]
  );

  const totalPlayerGoals = useMemo(
    () =>
      (playerStats ?? []).reduce(
        (sum, ps) => sum + (ps.played ? Number(ps.goals) || 0 : 0),
        0
      ),
    [playerStats]
  );

  // El marcador sigue a la suma de goles individuales hasta que se lo edite
  // a mano. Va por la suscripción de react-hook-form y no por un effect que
  // escriba en el render: el callback corre fuera del ciclo de renderizado.
  useEffect(() => {
    if (goalsForTouched) return;
    const subscription = form.watch((values, { name }) => {
      if (!name?.startsWith("player_stats")) return;
      const sum = (values.player_stats ?? []).reduce(
        (acc, ps) => acc + (ps?.played ? Number(ps.goals) || 0 : 0),
        0
      );
      if (Number(values.goals_for) !== sum) {
        form.setValue("goals_for", sum, { shouldValidate: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, goalsForTouched]);

  function togglePlayer(playerId: string) {
    const stats = form.getValues("player_stats") ?? [];
    const index = stats.findIndex((ps) => ps.player_id === playerId);
    if (index === -1) return;
    // No se borran los goles al desmarcar: hacen falta para poder avisar en
    // el diálogo qué datos se pierden al guardar.
    form.setValue(`player_stats.${index}.played`, !stats[index].played);
  }

  /** Qué datos se van a perder al guardar. Vacío = guardar directo. */
  function collectWarnings(data: MatchFormValues): string[] {
    if (data.status === "scheduled") return [];
    const warnings: string[] = [];

    for (const ps of data.player_stats ?? []) {
      if (ps.played) continue;
      const cargadas: string[] = [];
      if (ps.goals > 0) cargadas.push(`${ps.goals} ${ps.goals === 1 ? "gol" : "goles"}`);
      if (ps.assists > 0)
        cargadas.push(`${ps.assists} ${ps.assists === 1 ? "asistencia" : "asistencias"}`);
      if (ps.yellow_cards > 0) cargadas.push(`${ps.yellow_cards} 🟨`);
      if (ps.red_cards > 0) cargadas.push(`${ps.red_cards} 🟥`);
      if (cargadas.length > 0) {
        warnings.push(
          `${ps.nickname} no está en el partido y tenía ${cargadas.join(", ")} cargadas`
        );
      }
    }

    const rosterIds = new Set(
      (data.player_stats ?? []).filter((ps) => ps.played).map((ps) => ps.player_id)
    );
    for (const payment of existingPayments) {
      if (payment.status !== "paid" || rosterIds.has(payment.player_id)) continue;
      const nickname =
        (data.player_stats ?? []).find((ps) => ps.player_id === payment.player_id)
          ?.nickname ?? "Un jugador";
      warnings.push(
        `${nickname} sale del partido y su pago de $${Number(payment.amount).toLocaleString("es-AR")} estaba saldado`
      );
    }

    return warnings;
  }

  async function save(data: MatchFormValues) {
    setIsSubmitting(true);
    try {
      const submitData =
        data.status === "scheduled"
          ? {
              ...data,
              goals_for: 0,
              goals_against: 0,
              yellow_cards: 0,
              red_cards: 0,
              video_url: "",
              notes: "",
              player_stats: (data.player_stats ?? []).map((ps) => ({
                ...ps,
                played: false,
                goals: 0,
                assists: 0,
                yellow_cards: 0,
                red_cards: 0,
              })),
            }
          : data;

      const result = isEditing
        ? await updateMatch(existingMatch!.id, submitData)
        : await createMatch(submitData);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/matches");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Error inesperado al guardar el partido");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(data: MatchFormValues) {
    const warnings = collectWarnings(data);
    if (warnings.length > 0) {
      setPendingWarnings(warnings);
      return;
    }
    await save(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Datos del Partido</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchDetailsFields
              form={form}
              tournaments={tournaments}
              matchStatus={matchStatus}
              totalPlayerGoals={totalPlayerGoals}
              goalsForTouched={goalsForTouched}
              onGoalsForManualChange={(raw) => setGoalsForTouched(raw !== "")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">
              {matchStatus === "scheduled" ? "Quiénes van" : "Quiénes jugaron"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RosterPicker
              players={players}
              selectedIds={selectedIds}
              onToggle={togglePlayer}
              playedLabel={matchStatus === "scheduled" ? "Van" : "Jugaron"}
            />
          </CardContent>
        </Card>

        {matchStatus === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Stats de Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerStatsRows form={form} rows={statsRows} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? "Guardar Cambios" : "Crear Partido"}
          </Button>
        </div>
      </form>

      <SaveWarningsDialog
        open={pendingWarnings !== null}
        warnings={pendingWarnings ?? []}
        onCancel={() => setPendingWarnings(null)}
        onConfirm={() => {
          setPendingWarnings(null);
          void save(form.getValues());
        }}
      />
    </Form>
  );
}
