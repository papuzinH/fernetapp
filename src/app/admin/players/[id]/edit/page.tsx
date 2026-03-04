import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PlayerForm } from "@/components/forms/player-form";
import type { Player } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  const player = data as Player | null;
  if (!player) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Editar Jugador</h2>
        <p className="text-muted-foreground">{player.nickname}</p>
      </div>
      <PlayerForm existingPlayer={player} />
    </div>
  );
}
