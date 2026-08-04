import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BarChart3,
  CalendarRange,
  Flame,
  ShieldHalf,
  TrendingUp,
} from "lucide-react";
import {
  getOpponentRecords,
  getPlayerImpact,
  getPlayerStats,
  getRecentForm,
  getSeasonEvolution,
  getTeamStreaks,
  getTeamSummary,
  getTournaments,
} from "@/lib/supabase/queries/stats";
import { TournamentFilter } from "@/app/stats/tournament-filter";
import { PlayerStatsTable } from "@/app/stats/player-stats-table";
import { OpponentRecords } from "@/app/stats/opponent-records";
import { PlayerImpactList } from "@/app/stats/player-impact-list";
import {
  EfficiencyTrendChart,
  GoalsBySeasonChart,
  RecentFormChart,
} from "@/components/charts/season-charts";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ torneo?: string }>;
}

/** Tarjeta de número grande: la respuesta correcta cuando el dato es un solo valor */
function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`text-3xl font-serif font-bold tracking-tight mt-1.5 tabular-nums ${
            accent ? "text-accent" : ""
          }`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function StatsPage({ searchParams }: PageProps) {
  const { torneo } = await searchParams;

  const [
    tournaments,
    players,
    team,
    streaks,
    seasons,
    recentForm,
    opponents,
    impact,
  ] = await Promise.all([
    getTournaments(),
    getPlayerStats(torneo),
    getTeamSummary(torneo),
    getTeamStreaks(),
    getSeasonEvolution(),
    getRecentForm(15),
    getOpponentRecords(),
    getPlayerImpact(),
  ]);

  const selected = torneo ? tournaments.find((t) => t.id === torneo) : undefined;
  const scopeLabel = selected
    ? `${selected.name} ${selected.year}`
    : "Histórico completo";

  const streakLabel =
    streaks?.current_streak_result === "V"
      ? "victorias al hilo"
      : streaks?.current_streak_result === "E"
        ? "empates al hilo"
        : "derrotas al hilo";

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 space-y-10">
      {/* ── Header + filtro ── */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
            Estadísticas
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Los números de Fernet con Guaymallén, torneo por torneo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TournamentFilter tournaments={tournaments} current={torneo} />
          <Badge variant="outline" className="gap-1.5">
            <CalendarRange className="h-3 w-3" />
            {scopeLabel}
          </Badge>
        </div>
      </div>

      {/* ── Resumen del alcance elegido ── */}
      {team ? (
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatTile label="Partidos" value={team.total_matches} />
          <StatTile
            label="Victorias"
            value={team.wins}
            sub={`${team.draws} E · ${team.losses} D`}
          />
          <StatTile label="Efectividad" value={`${team.win_percentage ?? 0}%`} accent />
          <StatTile label="Goles a favor" value={team.total_goals_for} />
          <StatTile label="Goles en contra" value={team.total_goals_against} />
          <StatTile
            label="Diferencia"
            value={`${team.goal_difference > 0 ? "+" : ""}${team.goal_difference}`}
          />
        </section>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No hay partidos completados para este torneo todavía.
          </CardContent>
        </Card>
      )}

      {/* ── Tabla comparativa de jugadores ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="text-2xl font-serif font-bold tracking-tight">
            Jugadores
          </h2>
          {selected && (
            <Badge variant="secondary" className="text-[10px]">
              {selected.name} {selected.year}
            </Badge>
          )}
        </div>
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <PlayerStatsTable players={players} />
          </CardContent>
        </Card>
      </section>

      {/* ══════════════════════════════════════════════
          De acá para abajo todo es histórico completo:
          son series de tiempo y acumulados que no tienen
          sentido recortados a un solo torneo.
          ══════════════════════════════════════════════ */}
      <div className="space-y-10 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {/* El rango sale de los datos, no hardcodeado: el equipo existe
                desde 2017 pero lo cargado en la base arranca en 2023, y poner
                el año del club acá haría que la página muestre una fecha que
                sus propios números no respaldan. */}
            Análisis histórico
            {seasons.length > 0 &&
              ` · ${seasons[0].season_year}–${seasons[seasons.length - 1].season_year}`}
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* ── Rachas ── */}
        {streaks?.current_streak_length ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              <h2 className="text-2xl font-serif font-bold tracking-tight">Rachas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatTile
                label="Racha actual"
                value={`${streaks.current_streak_length} ${streakLabel}`}
                sub={
                  formatDate(streaks.current_streak_since)
                    ? `Desde el ${formatDate(streaks.current_streak_since)}`
                    : undefined
                }
                accent={streaks.current_streak_result === "V"}
              />
              <StatTile
                label="Mejor racha ganadora"
                value={streaks.best_win_streak ?? "—"}
                sub={
                  formatDate(streaks.best_win_streak_from)
                    ? `${formatDate(streaks.best_win_streak_from)} → ${formatDate(streaks.best_win_streak_to)}`
                    : undefined
                }
              />
              <StatTile
                label="Mejor invicto"
                value={streaks.best_unbeaten_streak ?? "—"}
                sub={
                  formatDate(streaks.best_unbeaten_streak_from)
                    ? `${formatDate(streaks.best_unbeaten_streak_from)} → ${formatDate(streaks.best_unbeaten_streak_to)}`
                    : undefined
                }
              />
            </div>
          </section>
        ) : null}

        {/* ── Forma reciente ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif font-bold tracking-tight">
              Forma reciente
            </h2>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Diferencia de gol en los últimos {recentForm.length} partidos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-1 sm:px-6">
              <RecentFormChart data={recentForm} />
            </CardContent>
          </Card>
        </section>

        {/* ── Evolución por temporada ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif font-bold tracking-tight">
              Evolución por temporada
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Efectividad por año
                </CardTitle>
              </CardHeader>
              <CardContent className="px-1 sm:px-6">
                <EfficiencyTrendChart data={seasons} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Goles por año
                </CardTitle>
              </CardHeader>
              <CardContent className="px-1 sm:px-6">
                <GoalsBySeasonChart data={seasons} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Impacto de jugadores ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif font-bold tracking-tight">
              Impacto en el equipo
            </h2>
          </div>
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <PlayerImpactList players={impact} />
            </CardContent>
          </Card>
        </section>

        {/* ── Rivales ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-accent" />
            <h2 className="text-2xl font-serif font-bold tracking-tight">
              Rivales repetidos
            </h2>
          </div>
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <OpponentRecords
                opponents={opponents.repeated}
                totalOpponents={opponents.totalOpponents}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
