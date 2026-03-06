import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PlayerDebtSummary =
  Database["public"]["Views"]["v_player_debt_summary"]["Row"];

/** Lista global de deudas de todos los jugadores, ordenada por deuda descendente */
export async function getPlayerDebtSummary() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_debt_summary")
    .select("*")
    .order("total_debt", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PlayerDebtSummary[];
}

/** Pagos de un jugador específico con datos del partido */
export async function getPlayerPayments(playerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      status,
      created_at,
      matches!inner (
        id,
        date,
        opponent,
        tournaments!inner ( name )
      )
    `)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    amount: row.amount as number,
    status: row.status as "pending" | "paid",
    created_at: row.created_at as string,
    match_id: row.matches.id as string,
    match_date: row.matches.date as string,
    opponent: row.matches.opponent as string,
    tournament_name: row.matches.tournaments.name as string,
  }));
}

export type PlayerPaymentDetail = Awaited<ReturnType<typeof getPlayerPayments>>[number];

/** Pagos de un partido específico con datos del jugador */
export async function getMatchPayments(matchId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      player_id,
      amount,
      status,
      players!inner ( nickname, full_name )
    `)
    .eq("match_id", matchId)
    .order("status", { ascending: true });

  if (error) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    player_id: row.player_id as string,
    amount: row.amount as number,
    status: row.status as "pending" | "paid",
    nickname: row.players.nickname as string,
    full_name: row.players.full_name as string | null,
  }));
}

export type MatchPaymentDetail = Awaited<ReturnType<typeof getMatchPayments>>[number];

/** Deuda de un jugador específico */
export async function getPlayerDebt(playerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_debt_summary")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error) return null;
  return data as PlayerDebtSummary;
}
