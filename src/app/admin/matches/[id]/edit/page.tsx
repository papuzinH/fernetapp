import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MatchForm } from "@/components/forms/match-form";
import type { Match, Tournament, Player, MatchPlayerStats } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMatchPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const matchRes = await supabase.from("matches").select("*").eq("id", id).single();
  const match = matchRes.data as Match | null;

  if (!match) notFound();

  const [tournamentsRes, playersRes, statsRes] = await Promise.all([
    supabase.from("tournaments").select("*").order("year", { ascending: false }),
    supabase.from("players").select("*").eq("is_active", true).order("nickname"),
    supabase.from("match_player_stats").select("*").eq("match_id", id),
  ]);

  const tournaments = (tournamentsRes.data ?? []) as Tournament[];
  const players = (playersRes.data ?? []) as Player[];
  const stats = (statsRes.data ?? []) as MatchPlayerStats[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Editar Partido</h2>
        <p className="text-muted-foreground">
          vs {match.opponent} — {new Date(match.date + "T12:00:00").toLocaleDateString("es-AR")}
        </p>
      </div>

      <MatchForm
        tournaments={tournaments}
        players={players}
        existingMatch={match}
        existingStats={stats}
      />
    </div>
  );
}
