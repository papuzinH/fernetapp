import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";
import type { Match } from "@/lib/supabase/types";

export type RecentMatch = Match & {
  tournaments: { name: string; year: number } | null;
};

function resultClasses(result: string | null) {
  if (result === "V")
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (result === "E") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function resultWord(result: string | null) {
  return result === "V" ? "Victoria" : result === "E" ? "Empate" : "Derrota";
}

function formatDate(date: string, withYear = true) {
  return new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    ...(withYear ? { year: "numeric" as const } : {}),
  });
}

/** La votación de MVP queda abierta 24 h desde la última edición del partido */
function isVotingOpen(match: RecentMatch) {
  const deadline = new Date(
    new Date(match.updated_at).getTime() + 24 * 60 * 60 * 1000
  );
  return match.status === "completed" && new Date() <= deadline;
}

export function RecentMatchesList({ matches }: { matches: RecentMatch[] }) {
  if (!matches.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No hay partidos registrados aún.
      </p>
    );
  }

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden sm:block">
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
            {matches.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/50">
                <TableCell>
                  <Link href={`/matches/${m.id}`} className="block">
                    {formatDate(m.date)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/matches/${m.id}`} className="block">
                    {m.tournaments
                      ? `${m.tournaments.name} ${m.tournaments.year}`
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
                      className={`font-mono font-bold ${resultClasses(m.result)}`}
                    >
                      {m.goals_for} - {m.goals_against}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {isVotingOpen(m) ? (
                    <Link href={`/matches/${m.id}/mvp`}>
                      <Badge
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-accent/10 text-yellow-600 border-yellow-300"
                      >
                        <Star className="h-3 w-3" />
                        Votar
                      </Badge>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile ── */}
      <ul className="sm:hidden divide-y">
        {matches.map((m) => (
          <li key={m.id} className="py-2.5">
            <div className="flex items-center gap-3">
              <Link
                href={`/matches/${m.id}`}
                className="flex flex-1 items-center gap-3 min-w-0 active:opacity-70 transition-opacity"
              >
                <Badge
                  variant="secondary"
                  className={`font-mono font-bold shrink-0 ${resultClasses(m.result)}`}
                >
                  {m.goals_for}-{m.goals_against}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{m.opponent}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(m.date, false)}
                    {m.tournaments ? ` · ${m.tournaments.name}` : ""}
                    {" · "}
                    <span className="sr-only">Resultado: </span>
                    {resultWord(m.result)}
                  </p>
                </div>
              </Link>
              {isVotingOpen(m) && (
                <Link href={`/matches/${m.id}/mvp`} className="shrink-0">
                  <Badge
                    variant="outline"
                    className="gap-1 text-yellow-600 border-yellow-300"
                  >
                    <Star className="h-3 w-3" />
                    Votar
                  </Badge>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
