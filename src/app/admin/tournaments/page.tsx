import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentCreateForm } from "./tournament-create-form";
import { TournamentDeleteButton } from "./tournament-delete-button";
import type { Tournament } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function TournamentsAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });
  const tournaments = (data ?? []) as Tournament[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Torneos</h2>
        <p className="text-muted-foreground">
          Gestionar los torneos y ligas del equipo.
        </p>
      </div>

      <TournamentCreateForm />

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Año</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-center">{t.year}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <TournamentDeleteButton
                      tournamentId={t.id}
                      tournamentName={`${t.name} ${t.year}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!tournaments || tournaments.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No hay torneos registrados. Creá uno arriba.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
