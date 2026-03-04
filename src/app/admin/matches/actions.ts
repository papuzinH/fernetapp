"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { matchSchema, type MatchFormValues } from "@/lib/schemas/match";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
  matchId?: string;
};

export async function createMatch(data: MatchFormValues): Promise<ActionResult> {
  // Validar con Zod en el server
  const parsed = matchSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: `Datos inválidos: ${parsed.error.issues.map((e) => e.message).join(", ")}`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { player_stats, video_url, notes, ...matchData } = parsed.data;

  // Insertar el partido
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .insert({
      ...matchData,
      video_url: video_url || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  const match = matchRow as { id: string } | null;

  if (matchError || !match) {
    console.error("Error creando partido:", matchError);
    return {
      success: false,
      message: `Error al guardar el partido: ${matchError?.message ?? "desconocido"}`,
    };
  }

  // Insertar stats de jugadores (si hay)
  if (player_stats && player_stats.length > 0) {
    const statsToInsert = player_stats
      .filter((ps) => ps.played)
      .map((ps) => ({
        match_id: match.id,
        player_id: ps.player_id,
        played: true,
        goals: ps.goals,
        assists: ps.assists,
        yellow_cards: ps.yellow_cards,
        red_cards: ps.red_cards,
      }));

    if (statsToInsert.length > 0) {
      const { error: statsError } = await supabase
        .from("match_player_stats")
        .insert(statsToInsert);

      if (statsError) {
        console.error("Error creando stats:", statsError);
        return {
          success: false,
          message: `Partido creado pero error en stats de jugadores: ${statsError.message}`,
        };
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fixtures");
  revalidatePath("/admin/matches");

  return { success: true, message: "Partido creado correctamente", matchId: match.id };
}

export async function updateMatch(
  matchId: string,
  data: MatchFormValues
): Promise<ActionResult> {
  const parsed = matchSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: `Datos inválidos: ${parsed.error.issues.map((e) => e.message).join(", ")}`,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { player_stats, video_url, notes, ...matchData } = parsed.data;

  const { error: matchError } = await supabase
    .from("matches")
    .update({
      ...matchData,
      video_url: video_url || null,
      notes: notes || null,
    })
    .eq("id", matchId);

  if (matchError) {
    return { success: false, message: `Error: ${matchError.message}` };
  }

  // Re-insertar stats (delete + insert para simplificar)
  if (player_stats) {
    await supabase.from("match_player_stats").delete().eq("match_id", matchId);

    const statsToInsert = player_stats
      .filter((ps) => ps.played)
      .map((ps) => ({
        match_id: matchId,
        player_id: ps.player_id,
        played: true,
        goals: ps.goals,
        assists: ps.assists,
        yellow_cards: ps.yellow_cards,
        red_cards: ps.red_cards,
      }));

    if (statsToInsert.length > 0) {
      const { error: statsError } = await supabase
        .from("match_player_stats")
        .insert(statsToInsert);

      if (statsError) {
        return {
          success: false,
          message: `Partido actualizado pero error en stats: ${statsError.message}`,
        };
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fixtures");
  revalidatePath("/admin/matches");

  return { success: true, message: "Partido actualizado correctamente" };
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    return { success: false, message: `Error: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fixtures");
  revalidatePath("/admin/matches");

  return { success: true, message: "Partido eliminado" };
}
