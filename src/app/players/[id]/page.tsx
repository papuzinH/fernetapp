import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPlayerCareerStats,
  getPlayerTournamentStats,
  getPlayerRecentMatches,
} from "@/lib/supabase/queries/players";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const positionLabel: Record<string, string> = {
  ARQ: "Arquero",
  DEF: "Defensor",
  MED: "Mediocampista",
  DEL: "Delantero",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [career, tournamentStats, recentMatches] = await Promise.all([
    getPlayerCareerStats(id),
    getPlayerTournamentStats(id),
    getPlayerRecentMatches(id, 10),
  ]);

  if (!career) notFound();

  const resultColor = (result: string) => {
    if (result === "V") return "text-green-600 bg-green-50 dark:bg-green-950/40";
    if (result === "E") return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40";
    return "text-red-600 bg-red-50 dark:bg-red-950/40";
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Botón volver */}
      <Link href="/players">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Jugadores
        </Button>
      </Link>

      {/* Header del jugador */}
      <div className="flex items-center gap-5">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
            {career.nickname.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {career.nickname}
            </h1>
            <Badge variant={career.is_active ? "default" : "secondary"}>
              {career.is_active ? "Activo" : "Retirado"}
            </Badge>
          </div>
          {career.full_name && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {career.full_name}
            </p>
          )}
          {career.position && (
            <Badge variant="outline" className="mt-2 text-xs">
              {positionLabel[career.position] ?? career.position}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats de carrera */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Stats de Carrera</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "Partidos", value: career.matches_played },
            { label: "Goles", value: career.total_goals },
            { label: "Asistencias", value: career.total_assists },
            { label: "Contribuciones", value: career.goal_contributions },
            {
              label: "Goles/PJ",
              value:
                typeof career.goals_per_match === "number"
                  ? career.goals_per_match.toFixed(2)
                  : "0.00",
            },
            { label: "🟨 Amarillas", value: career.total_yellow_cards },
            { label: "🟥 Rojas", value: career.total_red_cards },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats por torneo */}
      {tournamentStats.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Stats por Torneo</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Torneo</TableHead>
                      <TableHead className="text-center">PJ</TableHead>
                      <TableHead className="text-center">Goles</TableHead>
                      <TableHead className="text-center">Asist.</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">🟨</TableHead>
                      <TableHead className="hidden sm:table-cell text-center">🟥</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentStats.map((ts) => (
                      <TableRow key={ts.tournament_id}>
                        <TableCell className="font-medium">
                          {ts.tournament_name}{" "}
                          <span className="text-muted-foreground font-normal">
                            {ts.tournament_year}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{ts.matches_played}</TableCell>
                        <TableCell className="text-center font-semibold">
                          {ts.total_goals}
                        </TableCell>
                        <TableCell className="text-center">{ts.total_assists}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {ts.total_yellow_cards > 0 ? ts.total_yellow_cards : "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          {ts.total_red_cards > 0 ? ts.total_red_cards : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Últimos partidos */}
      {recentMatches.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Últimos Partidos</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table className="min-w-[380px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="hidden sm:table-cell">Torneo</TableHead>
                      <TableHead>Rival</TableHead>
                      <TableHead className="text-center">Resultado</TableHead>
                      <TableHead className="text-center">⚽</TableHead>
                      <TableHead className="text-center">🎯</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMatches.map((m) => (
                      <TableRow key={m.match_id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(m.date + "T12:00:00").toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            }
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {m.tournament_name} {m.tournament_year}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {m.opponent}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`font-mono text-xs font-bold ${resultColor(m.result)}`}
                          >
                            {m.goals_for}-{m.goals_against}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {m.goals > 0 ? m.goals : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.assists > 0 ? m.assists : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {recentMatches.length === 0 && tournamentStats.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-base font-normal">
              Este jugador aún no tiene partidos registrados.
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
