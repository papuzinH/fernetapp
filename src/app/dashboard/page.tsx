import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Target,
  Handshake,
  TrendingUp,
  Minus,
  TrendingDown,
  Beer,
} from "lucide-react";
import type { PlayerCareerStats, TeamSummary, Match } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { name: string; year: number } | null;
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch team summary
  const { data: teamSummaryData } = await supabase
    .from("v_team_summary")
    .select("*")
    .single();

  // Fetch top scorers
  const { data: topScorersData } = await supabase
    .from("v_player_career_stats")
    .select("*")
    .gt("total_goals", 0)
    .order("total_goals", { ascending: false })
    .limit(10);

  // Fetch top assisters
  const { data: topAssistersData } = await supabase
    .from("v_player_career_stats")
    .select("*")
    .gt("total_assists", 0)
    .order("total_assists", { ascending: false })
    .limit(10);

  // Fetch recent matches
  const { data: recentMatchesData } = await supabase
    .from("matches")
    .select("*, tournaments(name, year)")
    .order("date", { ascending: false })
    .limit(5);

  const team = teamSummaryData as TeamSummary | null;
  const scorers = (topScorersData ?? []) as PlayerCareerStats[];
  const assisters = (topAssistersData ?? []) as PlayerCareerStats[];
  const recentMatches = (recentMatchesData ?? []) as unknown as MatchWithTournament[];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Beer className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Fernet con Guaymallén
          </h1>
          <p className="text-muted-foreground">Historial Fernetero</p>
        </div>
      </div>

      {/* Team Summary Cards */}
      {team && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.total_matches}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" /> Victorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {team.wins}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Minus className="h-3 w-3 text-yellow-600" /> Empates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {team.draws}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600" /> Derrotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {team.losses}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Efectividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{team.win_percentage}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dif. de Gol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {team.goal_difference > 0 ? "+" : ""}
                {team.goal_difference}
              </div>
              <p className="text-xs text-muted-foreground">
                {team.total_goals_for} GF / {team.total_goals_against} GC
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Salón de la Fama */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Salón de la Fama
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Goleadores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goleadores Históricos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">Goles</TableHead>
                    <TableHead className="text-center">Prom.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scorers.map((p, i) => (
                    <TableRow key={p.player_id}>
                      <TableCell className="font-medium">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.nickname}
                          {i === 0 && (
                            <Badge variant="default" className="text-[10px]">
                              Goleador Histórico
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.matches_played}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {p.total_goals}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {p.goals_per_match}
                      </TableCell>
                    </TableRow>
                  ))}
                  {scorers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay datos de goleadores aún. Cargá partidos desde el panel Admin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Asistidores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Asistidores Históricos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">Asist.</TableHead>
                    <TableHead className="text-center">Sit. Gol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assisters.map((p, i) => (
                    <TableRow key={p.player_id}>
                      <TableCell className="font-medium">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.nickname}
                          {i === 0 && (
                            <Badge variant="default" className="text-[10px]">
                              Asistidor Histórico
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.matches_played}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {p.total_assists}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {p.goal_contributions}
                      </TableCell>
                    </TableRow>
                  ))}
                  {assisters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay datos de asistidores aún. Cargá partidos desde el panel Admin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Últimos Partidos */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Últimos Partidos
        </h2>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="text-center">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMatches?.map((m) => {
                  const resultColor =
                    m.result === "V"
                      ? "text-green-600 bg-green-50"
                      : m.result === "E"
                        ? "text-yellow-600 bg-yellow-50"
                        : "text-red-600 bg-red-50";
                  const tournament = m.tournaments as unknown as {
                    name: string;
                    year: number;
                  } | null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        {new Date(m.date + "T12:00:00").toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {tournament
                          ? `${tournament.name} ${tournament.year}`
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.opponent}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`font-mono font-bold ${resultColor}`}
                        >
                          {m.goals_for} - {m.goals_against}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!recentMatches || recentMatches.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No hay partidos registrados aún.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
