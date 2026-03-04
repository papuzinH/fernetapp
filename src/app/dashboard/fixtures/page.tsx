import { createServerSupabaseClient } from "@/lib/supabase/server";
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
import { FixtureFilters } from "./fixture-filters";
import type { Match, Tournament } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { id: string; name: string; year: number } | null;
};

interface PageProps {
  searchParams: Promise<{ tournament?: string; year?: string }>;
}

export default async function FixturesPage({ searchParams }: PageProps) {
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
  const matches = (matchesData ?? []) as unknown as MatchWithTournament[];

  const years = [
    ...new Set(tournaments.map((t) => t.year)),
  ].sort((a, b) => b - a);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fixture</h1>
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
                <TableHead className="hidden md:table-cell">Video</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches?.map((m) => {
                const resultColor =
                  m.result === "V"
                    ? "text-green-600 bg-green-50"
                    : m.result === "E"
                      ? "text-yellow-600 bg-yellow-50"
                      : "text-red-600 bg-red-50";
                const tournament = m.tournaments as unknown as {
                  id: string;
                  name: string;
                  year: number;
                } | null;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(m.date + "T12:00:00").toLocaleDateString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {tournament
                        ? `${tournament.name} ${tournament.year}`
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">{m.opponent}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`font-mono font-bold ${resultColor}`}
                      >
                        {m.goals_for} - {m.goals_against}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {m.yellow_cards > 0 ? m.yellow_cards : "-"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {m.red_cards > 0 ? m.red_cards : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {m.video_url ? (
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!matches || matches.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron partidos con los filtros seleccionados.
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
