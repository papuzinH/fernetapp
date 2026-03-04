import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MatchDeleteButton } from "./match-delete-button";
import type { Match } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { name: string; year: number } | null;
};

export default async function MatchesAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("matches")
    .select("*, tournaments(name, year)")
    .order("date", { ascending: false });

  const matches = (data ?? []) as unknown as MatchWithTournament[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Partidos</h2>
          <p className="text-muted-foreground">
            {matches?.length ?? 0} partidos registrados. Editar o corregir datos del historial.
          </p>
        </div>
        <Link href="/admin/matches/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Partido
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden sm:table-cell">Torneo</TableHead>
                  <TableHead>Rival</TableHead>
                  <TableHead className="text-center">Resultado</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">🟨</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">🟥</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                    name: string;
                    year: number;
                  } | null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(m.date + "T12:00:00").toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
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
                      <TableCell className="hidden sm:table-cell text-center">
                        {m.yellow_cards > 0 ? m.yellow_cards : "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {m.red_cards > 0 ? m.red_cards : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/matches/${m.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <MatchDeleteButton
                            matchId={m.id}
                            matchLabel={`vs ${m.opponent}`}
                          />
                        </div>
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
                      No hay partidos registrados aún.
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
