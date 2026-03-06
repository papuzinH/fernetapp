import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const voteSchema = z.object({
  match_id: z.string().uuid(),
  player_id: z.string().uuid(),
  device_id: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { match_id, player_id, device_id } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Verify match exists, is completed, and is within 24h voting window
  const { data: match } = await supabase
    .from("matches")
    .select("id, status, updated_at")
    .eq("id", match_id)
    .single();

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  if (match.status !== "completed") {
    return NextResponse.json(
      { error: "El partido aún no se completó" },
      { status: 400 }
    );
  }

  // Check 24h window from when the match was completed (updated_at)
  const completedAt = new Date(match.updated_at);
  const deadline = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
  if (new Date() > deadline) {
    return NextResponse.json(
      { error: "La votación ya cerró (pasaron más de 24hs)" },
      { status: 400 }
    );
  }

  // Verify player played in this match
  const { data: stat } = await supabase
    .from("match_player_stats")
    .select("id")
    .eq("match_id", match_id)
    .eq("player_id", player_id)
    .eq("played", true)
    .single();

  if (!stat) {
    return NextResponse.json(
      { error: "El jugador no participó en este partido" },
      { status: 400 }
    );
  }

  // Insert vote (UNIQUE constraint on match_id + device_id prevents duplicates)
  const { error } = await supabase.from("mvp_votes").insert({
    match_id,
    player_id,
    device_id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya votaste en este partido" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error al registrar el voto" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "¡Voto registrado!" });
}
