import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MatchForm, type ExistingPayment } from "@/components/forms/match-form";
import type { Match, Tournament, MatchPlayerStats } from "@/lib/supabase/types";
import type { SelectablePlayer } from "@/components/forms/roster-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

type SelectionRow = SelectablePlayer & { is_active: boolean };

export default async function EditMatchPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const matchRes = await supabase.from("matches").select("*").eq("id", id).single();
  const match = matchRes.data as Match | null;

  if (!match) notFound();

  const [tournamentsRes, playersRes, statsRes, paymentsRes] = await Promise.all([
    supabase.from("tournaments").select("*").order("year", { ascending: false }),
    supabase
      .from("v_player_selection_order")
      .select("player_id, nickname, is_active")
      .order("recent_appearances", { ascending: false })
      .order("total_appearances", { ascending: false })
      .order("nickname"),
    supabase.from("match_player_stats").select("*").eq("match_id", id),
    supabase.from("payments").select("player_id, amount, status").eq("match_id", id),
  ]);

  const tournaments = (tournamentsRes.data ?? []) as Tournament[];
  const stats = (statsRes.data ?? []) as MatchPlayerStats[];
  const payments = (paymentsRes.data ?? []) as ExistingPayment[];

  // Los inactivos se filtran acá y no en la consulta a propósito: un jugador
  // dado de baja que jugó este partido tiene que llegar al form igual, porque
  // updateMatch borra y reinserta las stats y sin él en la lista sus goles se
  // perderían al guardar.
  const playedIds = new Set(stats.map((s) => s.player_id));
  const players = ((playersRes.data ?? []) as SelectionRow[])
    .filter((p) => p.is_active || playedIds.has(p.player_id))
    .map(({ player_id, nickname }) => ({ player_id, nickname }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Editar Partido</h2>
        <p className="text-muted-foreground">
          vs {match.opponent} — {new Date(match.date + "T12:00:00").toLocaleDateString("es-AR")}
        </p>
      </div>

      <MatchForm
        tournaments={tournaments}
        players={players}
        existingMatch={match}
        existingStats={stats}
        existingPayments={payments}
      />
    </div>
  );
}
