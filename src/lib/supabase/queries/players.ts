import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PlayerCareerStats =
  Database["public"]["Views"]["v_player_career_stats"]["Row"];

export type PlayerTournamentStats =
  Database["public"]["Views"]["v_player_tournament_stats"]["Row"];

export type PlayerRecentMatch = {
  match_id: string;
  date: string;
  opponent: string;
  result: string;
  goals_for: number;
  goals_against: number;
  tournament_name: string;
  tournament_year: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

/** Lista todos los jugadores con sus stats de carrera, ordenados por partidos jugados */
export async function getPublicPlayers() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_career_stats")
    .select("*")
    .order("matches_played", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PlayerCareerStats[];
}

/** Stats de carrera de un jugador por su player_id */
export async function getPlayerCareerStats(playerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_career_stats")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error) return null;
  return data as PlayerCareerStats;
}

/** Stats por torneo de un jugador */
export async function getPlayerTournamentStats(playerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_tournament_stats")
    .select("*")
    .eq("player_id", playerId)
    .order("tournament_year", { ascending: false });

  if (error) return [];
  return (data ?? []) as PlayerTournamentStats[];
}

/** Últimos partidos jugados por un jugador (con datos del partido) */
export async function getPlayerRecentMatches(
  playerId: string,
  limit = 10
): Promise<PlayerRecentMatch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("match_player_stats")
    .select(
      `
      goals,
      assists,
      yellow_cards,
      red_cards,
      matches!inner (
        id,
        date,
        opponent,
        result,
        goals_for,
        goals_against,
        tournaments!inner ( name, year )
      )
    `
    )
    .eq("player_id", playerId)
    .eq("played", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    match_id: row.matches.id,
    date: row.matches.date,
    opponent: row.matches.opponent,
    result: row.matches.result,
    goals_for: row.matches.goals_for,
    goals_against: row.matches.goals_against,
    tournament_name: row.matches.tournaments.name,
    tournament_year: row.matches.tournaments.year,
    goals: row.goals,
    assists: row.assists,
    yellow_cards: row.yellow_cards,
    red_cards: row.red_cards,
  }));
}
