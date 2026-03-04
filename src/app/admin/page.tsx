import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, CalendarDays } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">¡Bienvenido, Admin Fernetero!</h2>
        <p className="text-muted-foreground">
          Desde acá podés gestionar toda la data del equipo.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Partidos
            </CardTitle>
            <CardDescription>
              Cargar nuevos partidos, editar resultados y corregir datos del historial.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/matches/new">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" /> Nuevo Partido
              </Button>
            </Link>
            <Link href="/admin/matches">
              <Button variant="outline" className="w-full">
                Ver Todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Jugadores
            </CardTitle>
            <CardDescription>
              Dar de alta nuevos integrantes, editar stats o desactivar jugadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/players/new">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" /> Nuevo Jugador
              </Button>
            </Link>
            <Link href="/admin/players">
              <Button variant="outline" className="w-full">
                Ver Todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Torneos
            </CardTitle>
            <CardDescription>
              Gestionar torneos y ligas (LN 9 DIV, Copa, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/tournaments">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" /> Gestionar Torneos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
