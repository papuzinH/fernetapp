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
import { PlayerToggleButton } from "./player-toggle-button";
import type { Player } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PlayersAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .order("nickname");
  const players = (data ?? []) as Player[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Jugadores</h2>
          <p className="text-muted-foreground">
            {players?.length ?? 0} jugadores registrados
          </p>
        </div>
        <Link href="/admin/players/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo Jugador
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
          <Table className="min-w-[400px]">
            <TableHeader>
              <TableRow>
                <TableHead>Apodo</TableHead>
                <TableHead className="hidden sm:table-cell">Nombre Completo</TableHead>
                <TableHead className="hidden xs:table-cell">Posición</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nickname}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.full_name || "-"}
                  </TableCell>
                  <TableCell className="hidden xs:table-cell">
                    {p.position ? (
                      <Badge variant="outline">{p.position}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={p.is_active ? "default" : "secondary"}
                    >
                      {p.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/players/${p.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <PlayerToggleButton
                        playerId={p.id}
                        isActive={p.is_active}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!players || players.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No hay jugadores registrados.
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
