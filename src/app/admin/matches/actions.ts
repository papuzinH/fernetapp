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
  const {
    player_stats,
    video_url,
    notes,
    location_name,
    location_address,
    datetime,
    pitch_price,
    ...matchData
  } = parsed.data;

  // Insertar el partido
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .insert({
      ...matchData,
      video_url: video_url || null,
      notes: notes || null,
      location_name: location_name || null,
      location_address: location_address || null,
      datetime: datetime || null,
      pitch_price: pitch_price ?? null,
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

      // Si el partido es completed y tiene pitch_price, crear pagos automáticos
      if (parsed.data.status === "completed" && pitch_price && pitch_price > 0) {
        const playersWhoPlayed = statsToInsert.length;
        const costPerPlayer = Math.round((pitch_price / playersWhoPlayed) * 100) / 100;
        const paymentsToInsert = statsToInsert.map((ps) => ({
          match_id: match.id,
          player_id: ps.player_id,
          amount: costPerPlayer,
          status: "pending" as const,
        }));
        await supabase.from("payments").insert(paymentsToInsert);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fixtures");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/payments");

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
  const {
    player_stats,
    video_url,
    notes,
    location_name,
    location_address,
    datetime,
    pitch_price,
    ...matchData
  } = parsed.data;

  // Obtener el estado anterior para detectar transición scheduled → completed
  const { data: prevMatch } = await supabase
    .from("matches")
    .select("status, pitch_price")
    .eq("id", matchId)
    .single();

  const { error: matchError } = await supabase
    .from("matches")
    .update({
      ...matchData,
      video_url: video_url || null,
      notes: notes || null,
      location_name: location_name || null,
      location_address: location_address || null,
      datetime: datetime || null,
      pitch_price: pitch_price ?? null,
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

      // Si transiciona a completed y tiene pitch_price, crear pagos
      const effectivePrice = pitch_price ?? prevMatch?.pitch_price;
      const wasScheduled = prevMatch?.status === "scheduled";
      const isNowCompleted = parsed.data.status === "completed";

      if (wasScheduled && isNowCompleted && effectivePrice && effectivePrice > 0) {
        // Limpiar pagos previos si los hubiera
        await supabase.from("payments").delete().eq("match_id", matchId);

        const playersWhoPlayed = statsToInsert.length;
        const costPerPlayer = Math.round((effectivePrice / playersWhoPlayed) * 100) / 100;
        const paymentsToInsert = statsToInsert.map((ps) => ({
          match_id: matchId,
          player_id: ps.player_id,
          amount: costPerPlayer,
          status: "pending" as const,
        }));
        await supabase.from("payments").insert(paymentsToInsert);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fixtures");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/payments");

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
  revalidatePath("/admin/payments");

  return { success: true, message: "Partido eliminado" };
}

// ============================================
// Payment Actions (Fernet-Wise)
// ============================================

export async function markPaymentPaid(paymentId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("id", paymentId);

  if (error) {
    return { success: false, message: `Error: ${error.message}` };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/players");
  return { success: true, message: "Pago registrado" };
}

export async function markPaymentPending(paymentId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "pending" })
    .eq("id", paymentId);

  if (error) {
    return { success: false, message: `Error: ${error.message}` };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/players");
  return { success: true, message: "Pago marcado como pendiente" };
}

export async function generatePaymentsForMatch(matchId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // Obtener datos del partido
  const { data: match } = await supabase
    .from("matches")
    .select("pitch_price, status")
    .eq("id", matchId)
    .single();

  if (!match || match.status !== "completed") {
    return { success: false, message: "El partido debe estar completado" };
  }
  if (!match.pitch_price || match.pitch_price <= 0) {
    return { success: false, message: "El partido no tiene precio de cancha" };
  }

  // Obtener jugadores que jugaron
  const { data: stats } = await supabase
    .from("match_player_stats")
    .select("player_id")
    .eq("match_id", matchId)
    .eq("played", true);

  if (!stats || stats.length === 0) {
    return { success: false, message: "No hay jugadores registrados en este partido" };
  }

  // Limpiar pagos previos
  await supabase.from("payments").delete().eq("match_id", matchId);

  const costPerPlayer = Math.round((match.pitch_price / stats.length) * 100) / 100;
  const paymentsToInsert = stats.map((s) => ({
    match_id: matchId,
    player_id: s.player_id,
    amount: costPerPlayer,
    status: "pending" as const,
  }));

  const { error } = await supabase.from("payments").insert(paymentsToInsert);
  if (error) {
    return { success: false, message: `Error creando pagos: ${error.message}` };
  }

  revalidatePath("/admin/payments");
  return {
    success: true,
    message: `Pagos generados: $${costPerPlayer} por jugador (${stats.length} jugadores)`,
  };
}
