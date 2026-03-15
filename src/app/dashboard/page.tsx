import { createServerSupabaseClient } from "@/lib/supabase/server";
import Image from "next/image";
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
import Link from "next/link";
import {
  Trophy,
  Target,
  Handshake,
  TrendingUp,
  Minus,
  TrendingDown,
  Star,
  Award,
  Swords,
  Percent,
  Crosshair,
} from "lucide-react";
import { NextMatchWidget } from "@/components/next-match-widget";
import { CurrentPositionWidget } from "@/components/current-position-widget";
import { InstagramWidget } from "@/components/instagram-widget";
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

  // Fetch top MVPs
  const { data: topMvpsData } = await supabase
    .from("v_player_career_stats")
    .select("*")
    .gt("mvp_count", 0)
    .order("mvp_count", { ascending: false })
    .limit(10);

  // Fetch recent matches (only completed)
  const { data: recentMatchesData } = await supabase
    .from("matches")
    .select("*, tournaments(name, year)")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(5);

  const team = teamSummaryData as TeamSummary | null;
  const scorers = (topScorersData ?? []) as PlayerCareerStats[];
  const assisters = (topAssistersData ?? []) as PlayerCareerStats[];
  const mvps = (topMvpsData ?? []) as PlayerCareerStats[];
  const recentMatches = (recentMatchesData ?? []) as unknown as MatchWithTournament[];

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* ── Hero Header ── */}
      <div className="relative rounded-3xl overflow-hidden text-white" style={{ minHeight: "220px" }}>
        <Image
          src="/Gemini_Generated_Image_rirq81rirq81rirq.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dramatic claroscuro overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/95 via-[#0A0A0B]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/60 via-transparent to-transparent" />

        <div className="relative flex items-center justify-between px-6 md:px-10 py-10">
          <div className="flex items-center gap-6">
            <Image
              src="/Escudo Fernet 2023 PNG.png"
              alt="Escudo Club Atlético Fernet con Guaymallén"
              width={96}
              height={96}
              className="object-contain drop-shadow-[0_0_20px_oklch(0.60_0.16_55/0.3)] shrink-0"
              priority
            />
            <div>
              <p className="text-white/40 text-xs font-semibold tracking-[0.25em] uppercase mb-1.5">
                Club Atlético
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight leading-none">
                Fernet con Guaymallén
              </h1>
              <p className="text-white/50 text-sm mt-2 tracking-wide">Historial Fernetero</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Next Match Widget ── */}
      <NextMatchWidget />

      {/* ── Current Position Widget ── */}
      <CurrentPositionWidget />

      {/* ── Team Summary — Bento Grid ── */}
      {team && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Partidos", value: team.total_matches, icon: Swords, color: "" },
            { label: "Victorias", value: team.wins, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Empates", value: team.draws, icon: Minus, color: "text-amber-400" },
            { label: "Derrotas", value: team.losses, icon: TrendingDown, color: "text-red-400" },
            { label: "Efectividad", value: `${team.win_percentage}%`, icon: Percent, color: "" },
            {
              label: "Dif. de Gol",
              value: `${team.goal_difference > 0 ? "+" : ""}${team.goal_difference}`,
              icon: Crosshair,
              color: "",
              sub: `${team.total_goals_for} GF / ${team.total_goals_against} GC`,
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`} />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
                <p className={`text-3xl font-serif font-bold tracking-tight ${stat.color}`}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Salón de la Fama ── */}
      <div className="bg-stripes rounded-2xl p-6 md:p-8 border border-border/30 dark:border-white/[0.04] space-y-6">
        <h2 className="text-3xl font-serif font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-7 w-7 text-accent" />
          Salón de la Fama
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Goleadores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
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
                          <Link href={`/players/${p.player_id}`} className="hover:underline hover:text-accent">
                            {p.nickname}
                          </Link>
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
                <Handshake className="h-5 w-5 text-accent" />
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
                          <Link href={`/players/${p.player_id}`} className="hover:underline hover:text-accent">
                            {p.nickname}
                          </Link>
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

        {/* Top MVPs */}
        {mvps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Más Valiosos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">⭐ MVP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mvps.map((p, i) => (
                    <TableRow key={p.player_id}>
                      <TableCell className="font-medium">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/players/${p.player_id}`} className="hover:underline hover:text-accent">
                            {p.nickname}
                          </Link>
                          {i === 0 && (
                            <Badge variant="default" className="text-[10px]">
                              Más Valioso
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.matches_played}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {p.mvp_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Últimos Partidos ── */}
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-5">
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
                  <TableHead className="text-center">MVP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMatches?.map((m) => {
                  const resultColor =
                    m.result === "V"
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : m.result === "E"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-red-400 bg-red-500/10 border-red-500/20";
                  const tournament = m.tournaments as unknown as {
                    name: string;
                    year: number;
                  } | null;
                  return (
                    <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/matches/${m.id}`} className="block">
                          {new Date(m.date + "T12:00:00").toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/matches/${m.id}`} className="block">
                          {tournament
                            ? `${tournament.name} ${tournament.year}`
                            : "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/matches/${m.id}`} className="block">
                          {m.opponent}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/matches/${m.id}`}>
                          <Badge
                            variant="secondary"
                            className={`font-mono font-bold ${resultColor}`}
                          >
                            {m.goals_for} - {m.goals_against}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const updated = new Date(m.updated_at);
                          const deadline = new Date(updated.getTime() + 24 * 60 * 60 * 1000);
                          const isVotingOpen = m.status === "completed" && new Date() <= deadline;
                          if (isVotingOpen) {
                            return (
                              <Link href={`/matches/${m.id}/mvp`}>
                                <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent/10 text-yellow-600 border-yellow-300">
                                  <Star className="h-3 w-3" />
                                  Votar
                                </Badge>
                              </Link>
                            );
                          }
                          return <span className="text-muted-foreground">—</span>;
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!recentMatches || recentMatches.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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

        {/* ── Instagram Widget ── */}
        <InstagramWidget />
      </div>
    </div>
  );
}
