import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  OpponentRecord,
  PlayerCareerStats,
  PlayerImpact,
  PlayerTournamentStats,
  TeamSeasonEvolution,
  TeamStreaks,
  TeamSummary,
  TeamTournamentSummary,
  Tournament,
} from "@/lib/supabase/types";

/**
 * Fila unificada de la tabla comparativa de jugadores.
 *
 * La página de stats muestra la misma tabla ya sea en modo histórico o filtrada
 * por torneo, pero los datos vienen de dos views distintas: v_player_career_stats
 * y v_player_tournament_stats. Este tipo es el denominador común, así que la UI
 * no necesita saber de cuál de las dos salió cada fila.
 */
export type PlayerStatsRow = {
  player_id: string;
  nickname: string;
  full_name: string | null;
  position: string | null;
  is_active: boolean;
  avatar_url: string | null;
  matches_played: number;
  total_goals: number;
  total_assists: number;
  goal_contributions: number;
  goals_per_match: number;
  total_yellow_cards: number;
  total_red_cards: number;
  mvp_count: number;
};

/** Resumen del equipo, con la misma forma sea histórico o de un torneo puntual */
export type TeamSummaryRow = {
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  win_percentage: number;
  total_goals_for: number;
  total_goals_against: number;
  goal_difference: number;
};

/** Lista de torneos para el selector, del más nuevo al más viejo */
export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Tournament[];
}

/**
 * Stats de todos los jugadores. Sin tournamentId devuelve la carrera completa;
 * con tournamentId, solo lo hecho en ese torneo.
 */
export async function getPlayerStats(
  tournamentId?: string
): Promise<PlayerStatsRow[]> {
  const supabase = await createServerSupabaseClient();

  if (!tournamentId) {
    const { data, error } = await supabase
      .from("v_player_career_stats")
      .select("*")
      // v_player_career_stats sale de un LEFT JOIN, así que incluye a todo el
      // plantel histórico haya jugado o no. Sin este filtro la tabla arrastra
      // ~23 filas en cero que no dicen nada y en celular son media pantalla.
      .gt("matches_played", 0)
      .order("total_goals", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PlayerCareerStats[];
  }

  const { data, error } = await supabase
    .from("v_player_tournament_stats")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("total_goals", { ascending: false });

  if (error) throw error;

  // v_player_tournament_stats trae además las columnas del torneo; el resto de
  // la forma coincide con la view de carrera, así que la fila sirve tal cual.
  return (data ?? []) as PlayerTournamentStats[];
}

/** Resumen del equipo: histórico completo, o el de un torneo puntual */
export async function getTeamSummary(
  tournamentId?: string
): Promise<TeamSummaryRow | null> {
  const supabase = await createServerSupabaseClient();

  if (!tournamentId) {
    const { data } = await supabase.from("v_team_summary").select("*").single();
    return (data as TeamSummary | null) ?? null;
  }

  const { data } = await supabase
    .from("v_team_tournament_summary")
    .select("*")
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  return (data as TeamTournamentSummary | null) ?? null;
}

/**
 * Impacto de cada jugador: cómo le fue al equipo con él en cancha.
 *
 * Se filtran los que tienen menos de `minMatches` partidos porque con 2 o 3
 * partidos el porcentaje es ruido — el que jugó una vez y ganó aparecería
 * primero con 100% de efectividad.
 */
export async function getPlayerImpact(minMatches = 5): Promise<PlayerImpact[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_player_impact")
    .select("*")
    .gte("matches_played", minMatches)
    .order("points_percentage", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PlayerImpact[];
}

/**
 * Rivales que se enfrentaron más de una vez, más el total de rivales distintos.
 *
 * El total va aparte porque sin él la sección miente por omisión: hoy el equipo
 * jugó contra 54 rivales y solo 4 se repitieron, así que mostrar únicamente esos
 * 4 se lee como "estos son los rivales" cuando son la excepción.
 */
export async function getOpponentRecords(minMatches = 2): Promise<{
  repeated: OpponentRecord[];
  totalOpponents: number;
}> {
  const supabase = await createServerSupabaseClient();

  const [repeatedRes, countRes] = await Promise.all([
    supabase
      .from("v_opponent_record")
      .select("*")
      .gte("total_matches", minMatches)
      .order("total_matches", { ascending: false })
      .order("win_percentage", { ascending: false }),
    supabase.from("v_opponent_record").select("*", { count: "exact", head: true }),
  ]);

  if (repeatedRes.error) throw repeatedRes.error;
  return {
    repeated: (repeatedRes.data ?? []) as OpponentRecord[],
    totalOpponents: countRes.count ?? 0,
  };
}

/** Evolución año a año, en orden cronológico para el gráfico */
export async function getSeasonEvolution(): Promise<TeamSeasonEvolution[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_team_season_evolution")
    .select("*")
    .order("season_year", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TeamSeasonEvolution[];
}

/** Rachas del equipo. La view devuelve siempre una fila (NULLs si no hay datos) */
export async function getTeamStreaks(): Promise<TeamStreaks | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("v_team_streaks").select("*").maybeSingle();
  return (data as TeamStreaks | null) ?? null;
}

/**
 * Últimos resultados en orden cronológico, para el gráfico de forma reciente.
 * Se pide descendente (que es donde pega el índice de matches.date) y se da
 * vuelta acá, porque el gráfico los necesita del más viejo al más nuevo.
 */
export async function getRecentForm(limit = 15) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id, date, opponent, result, goals_for, goals_against")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).slice().reverse() as {
    id: string;
    date: string;
    opponent: string;
    result: string;
    goals_for: number;
    goals_against: number;
  }[];
}
