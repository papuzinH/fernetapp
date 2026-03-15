import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FixtureFilters } from "@/app/dashboard/fixtures/fixture-filters";
import { CalendarClock } from "lucide-react";
import type { Match, Tournament } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { id: string; name: string; year: number } | null;
};

interface PageProps {
  searchParams: Promise<{ tournament?: string; year?: string; status?: string }>;
}

export default async function MatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Fetch tournaments for filter
  const { data: tournamentsData } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });

  const tournaments = (tournamentsData ?? []) as Tournament[];

  // Fetch matches with optional filters
  let query = supabase
    .from("matches")
    .select("*, tournaments(id, name, year)")
    .order("date", { ascending: false });

  if (params.tournament) {
    query = query.eq("tournament_id", params.tournament);
  }

  if (params.year) {
    const year = parseInt(params.year);
    query = query
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
  }

  const { data: matchesData } = await query;
  const allMatches = (matchesData ?? []) as unknown as MatchWithTournament[];

  // Separate completed and scheduled
  const completedMatches = allMatches.filter((m) => m.status === "completed");
  const scheduledMatches = allMatches.filter((m) => m.status === "scheduled");

  const years = [
    ...new Set(tournaments.map((t) => t.year)),
  ].sort((a, b) => b - a);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold tracking-tight">Partidos</h1>
        <p className="text-muted-foreground">
          Todos los partidos de Fernet con Guaymallén
        </p>
      </div>

      <FixtureFilters
        tournaments={tournaments}
        years={years}
        currentTournament={params.tournament}
        currentYear={params.year}
      />

      {/* Próximos partidos */}
      {scheduledMatches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent" />
            Próximos Partidos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scheduledMatches.map((m) => {
              const tournament = m.tournaments as unknown as {
                id: string;
                name: string;
                year: number;
              } | null;
              const matchDatetime = m.datetime ? new Date(m.datetime) : null;
              return (
                <Link key={m.id} href={`/matches/${m.id}`}>
                  <Card className="hover:border-accent/40 hover:shadow-[0_0_20px_oklch(0.60_0.16_55/0.1)] transition-all cursor-pointer h-full border-accent/15">
                    <CardContent className="pt-5 pb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold" className="text-xs">
                          Programado
                        </Badge>
                        {tournament && (
                          <span className="text-xs text-muted-foreground">
                            {tournament.name} {tournament.year}
                          </span>
                        )}
                      </div>
                      <p className="font-serif font-bold text-lg">
                        Fernet FC <span className="text-muted-foreground font-sans font-normal">vs</span>{" "}
                        {m.opponent}
                      </p>
                      {matchDatetime && (
                        <p className="text-sm text-muted-foreground">
                          {matchDatetime.toLocaleDateString("es-AR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}{" "}
                          — {matchDatetime.toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}hs
                        </p>
                      )}
                      {m.location_name && (
                        <p className="text-xs text-muted-foreground">
                          📍 {m.location_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Partidos completados */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Torneo</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="text-center">Resultado</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">🟨</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">🟥</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedMatches.map((m) => {
                  const resultColor =
                    m.result === "V"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : m.result === "E"
                        ? "text-amber-400 bg-amber-400/10"
                        : "text-red-400 bg-red-400/10";
                  const tournament = m.tournaments as unknown as {
                    id: string;
                    name: string;
                    year: number;
                  } | null;
                  return (
                    <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/matches/${m.id}`} className="block">
                          {new Date(m.date + "T12:00:00").toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
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
                      <TableCell className="hidden sm:table-cell text-center">
                        {m.yellow_cards > 0 ? m.yellow_cards : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {m.red_cards > 0 ? m.red_cards : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {completedMatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No se encontraron partidos completados con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
