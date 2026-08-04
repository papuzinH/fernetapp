import { createServerSupabaseClient } from "@/lib/supabase/server";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Handshake,
  TrendingUp,
  Minus,
  TrendingDown,
  Award,
  Swords,
  Percent,
  Crosshair,
} from "lucide-react";
import { NextMatchWidget } from "@/components/next-match-widget";
import { CurrentPositionWidget } from "@/components/current-position-widget";
import { InstagramWidget } from "@/components/instagram-widget";
import { Leaderboard } from "@/components/leaderboard";
import {
  RecentMatchesList,
  type RecentMatch,
} from "@/components/recent-matches-list";
import type { PlayerCareerStats, TeamSummary } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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
  const recentMatches = (recentMatchesData ?? []) as unknown as RecentMatch[];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 space-y-10">
      {/* ── Hero Header ── */}
      <div className="relative rounded-3xl overflow-hidden text-white" >
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

        <div className="relative flex items-center justify-between px-4 sm:px-6 md:px-10 py-8 sm:py-10">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Image
              src="/Escudo Fernet 2023 PNG.png"
              alt="Escudo Club Atlético Fernet con Guaymallén"
              width={96}
              height={96}
              className="object-contain drop-shadow-[0_0_20px_oklch(0.60_0.16_55/0.3)] shrink-0 w-16 h-16 sm:w-24 sm:h-24"
              priority
            />
            <div className="min-w-0">
              <p className="text-white/40 text-xs font-semibold tracking-[0.25em] uppercase mb-1.5">
                Club Atlético
              </p>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight leading-none">
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
      <div className="bg-stripes rounded-2xl p-3 sm:p-6 md:p-8 border border-border/30 dark:border-white/[0.04] space-y-6">
        <h2 className="text-3xl font-serif font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-7 w-7 text-accent" />
          Salón de la Fama
        </h2>

        {/* Top Goleadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Goleadores Históricos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Leaderboard
              primaryLabel="Goles"
              topBadge="Goleador Histórico"
              emptyMessage="No hay datos de goleadores aún. Cargá partidos desde el panel Admin."
              items={scorers.map((p) => ({
                id: p.player_id,
                nickname: p.nickname,
                avatar_url: p.avatar_url,
                primary: p.total_goals,
                secondary: [
                  { label: "PJ", value: p.matches_played },
                  { label: "Prom.", value: p.goals_per_match },
                ],
              }))}
            />
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
          <CardContent className="px-3 sm:px-6">
            <Leaderboard
              primaryLabel="Asist."
              topBadge="Asistidor Histórico"
              emptyMessage="No hay datos de asistidores aún. Cargá partidos desde el panel Admin."
              items={assisters.map((p) => ({
                id: p.player_id,
                nickname: p.nickname,
                avatar_url: p.avatar_url,
                primary: p.total_assists,
                secondary: [
                  { label: "PJ", value: p.matches_played },
                  { label: "G+A", value: p.goal_contributions },
                ],
              }))}
            />
          </CardContent>
        </Card>

        {/* Top MVPs */}
        {mvps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Más Valiosos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Leaderboard
                primaryLabel="MVP"
                topBadge="Más Valioso"
                emptyMessage="Todavía no hay MVPs votados."
                items={mvps.map((p) => ({
                  id: p.player_id,
                  nickname: p.nickname,
                  avatar_url: p.avatar_url,
                  primary: p.mvp_count,
                  secondary: [{ label: "PJ", value: p.matches_played }],
                }))}
              />
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
          <CardContent className="px-3 sm:px-6 pt-6">
            <RecentMatchesList matches={recentMatches} />
          </CardContent>
        </Card>

        {/* ── Instagram Widget ── */}
        <InstagramWidget />
      </div>
    </div>
  );
}
