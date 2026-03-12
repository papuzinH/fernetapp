import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Video,
  PenLine,
  Star,
} from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { MvpVoteClient } from "@/components/mvp-vote-client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Match, MatchPlayerStats } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { name: string; year: number } | null;
};

type StatWithPlayer = MatchPlayerStats & {
  players: { id: string; nickname: string } | null;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id: matchId } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch match with tournament
  const { data: matchData } = await supabase
    .from("matches")
    .select("*, tournaments(name, year)")
    .eq("id", matchId)
    .single();

  if (!matchData) notFound();

  const match = matchData as unknown as MatchWithTournament;
  const tournament = match.tournaments as unknown as {
    name: string;
    year: number;
  } | null;

  const isCompleted = match.status === "completed";
  const isScheduled = match.status === "scheduled";

  // Fetch player stats for this match
  const { data: statsData } = await supabase
    .from("match_player_stats")
    .select("*, players!inner(id, nickname)")
    .eq("match_id", matchId)
    .eq("played", true)
    .order("goals", { ascending: false });

  const playerStats = (statsData ?? []) as unknown as StatWithPlayer[];

  // MVP players for voting
  const mvpPlayers = playerStats.map((s) => ({
    player_id: s.player_id,
    nickname: s.players?.nickname ?? "?",
  }));

  // Check if match datetime has passed + 1h (for "complete stats" button)
  const matchDatetime = match.datetime ? new Date(match.datetime) : null;
  const now = new Date();
  const canComplete =
    isScheduled &&
    matchDatetime &&
    now > new Date(matchDatetime.getTime() + 60 * 60 * 1000);

  // Format display values
  const formattedDate = match.datetime
    ? format(new Date(match.datetime), "EEEE d 'de' MMMM yyyy — HH:mm'hs'", {
        locale: es,
      })
    : new Date(match.date + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const resultColor =
    match.result === "V"
      ? "text-green-600 bg-green-100 dark:bg-green-950/50"
      : match.result === "E"
        ? "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/50"
        : "text-red-600 bg-red-100 dark:bg-red-950/50";

  const resultLabel =
    match.result === "V"
      ? "VICTORIA"
      : match.result === "E"
        ? "EMPATE"
        : "DERROTA";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      {/* Back button */}
      <Link href="/matches">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Partidos
        </Button>
      </Link>

      {/* Match Header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="space-y-4">
            {/* Status + Tournament */}
            <div className="flex flex-wrap items-center gap-2">
              {isScheduled && (
                <Badge
                  variant="outline"
                  className="text-blue-600 border-blue-300"
                >
                  Programado
                </Badge>
              )}
              {tournament && (
                <Badge variant="secondary">
                  {tournament.name} {tournament.year}
                </Badge>
              )}
            </div>

            {/* Teams */}
            <div className="text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight">
                Fernet FC{" "}
                <span className="text-muted-foreground font-normal text-xl sm:text-2xl">
                  vs
                </span>{" "}
                {match.opponent}
              </p>

              {/* Result (only for completed) */}
              {isCompleted && (
                <div className="flex items-center justify-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`text-3xl font-mono font-black px-6 py-2 ${resultColor}`}
                  >
                    {match.goals_for} - {match.goals_against}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${resultColor}`}
                  >
                    {resultLabel}
                  </Badge>
                </div>
              )}
            </div>

            {/* Match Info */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formattedDate}
              </span>
              {match.location_name && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {match.location_name}
                </span>
              )}
              {match.video_url && (
                <a
                  href={match.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Video className="h-4 w-4" />
                  Ver video
                </a>
              )}
            </div>

            {/* Countdown for scheduled matches */}
            {isScheduled && matchDatetime && matchDatetime > now && (
              <div className="text-center pt-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Faltan
                </p>
                <CountdownTimer targetDate={match.datetime!} />
              </div>
            )}

            {/* Complete stats banner */}
            {canComplete && (
              <div className="flex items-center justify-center pt-2">
                <Link href={`/admin/matches/${matchId}/edit`}>
                  <Button className="gap-2">
                    <PenLine className="h-4 w-4" />
                    Completar Estadísticas
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Stats (only for completed) */}
      {isCompleted && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{match.goals_for}</p>
              <p className="text-xs text-muted-foreground">Goles a favor</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{match.goals_against}</p>
              <p className="text-xs text-muted-foreground">Goles en contra</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{match.yellow_cards}</p>
              <p className="text-xs text-muted-foreground">🟨 Amarillas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{match.red_cards}</p>
              <p className="text-xs text-muted-foreground">🟥 Rojas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Player Stats (only for completed) */}
      {isCompleted && playerStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas Individuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">⚽ Goles</TableHead>
                    <TableHead className="text-center">🎯 Asist.</TableHead>
                    <TableHead className="text-center">🟨</TableHead>
                    <TableHead className="text-center">🟥</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((s) => (
                    <TableRow key={s.player_id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/players/${s.player_id}`}
                          className="hover:underline hover:text-accent"
                        >
                          {s.players?.nickname ?? "?"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {s.goals > 0 ? s.goals : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.assists > 0 ? s.assists : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.yellow_cards > 0 ? s.yellow_cards : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.red_cards > 0 ? s.red_cards : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MVP Section (only for completed) */}
      {isCompleted && mvpPlayers.length > 0 && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <CardTitle>Figura del Partido</CardTitle>
          </CardHeader>
          <CardContent>
            <MvpVoteClient matchId={matchId} players={mvpPlayers} />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {match.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {match.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
