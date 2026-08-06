import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchForm } from "@/components/forms/match-form";
import type { Tournament } from "@/lib/supabase/types";
import type { SelectablePlayer } from "@/components/forms/roster-picker";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const supabase = await createServerSupabaseClient();

  const [tournamentsRes, playersRes] = await Promise.all([
    supabase.from("tournaments").select("*").order("year", { ascending: false }),
    // Ordenados por qué tan probable es que hayan jugado: primero los que
    // vienen jugando, no los que empiezan con A.
    supabase
      .from("v_player_selection_order")
      .select("player_id, nickname")
      .eq("is_active", true)
      .order("recent_appearances", { ascending: false })
      .order("total_appearances", { ascending: false })
      .order("nickname"),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight">Nuevo Partido</h2>
        <p className="text-muted-foreground">
          Cargá los datos del partido y las estadísticas individuales.
        </p>
      </div>

      <MatchForm
        tournaments={(tournamentsRes.data ?? []) as Tournament[]}
        players={(playersRes.data ?? []) as SelectablePlayer[]}
      />
    </div>
  );
}
