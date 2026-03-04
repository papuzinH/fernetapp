import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchForm } from "@/components/forms/match-form";
import type { Tournament, Player } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const supabase = await createServerSupabaseClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("is_active", true)
    .order("nickname");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo Partido</h2>
        <p className="text-muted-foreground">
          Cargá los datos del partido y las estadísticas individuales.
        </p>
      </div>

      <MatchForm
        tournaments={(tournaments ?? []) as Tournament[]}
        players={(players ?? []) as Player[]}
      />
    </div>
  );
}
