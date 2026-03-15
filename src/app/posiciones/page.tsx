import { fetchStandings } from "@/lib/services/scraper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tabla de Posiciones | FernetApp",
};

const CLASSIFICATION_ZONE = 4;

export default async function PosicionesPage() {
  const data = await fetchStandings();

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold">
              No pudimos cargar la tabla de posiciones
            </h2>
            <p className="text-sm text-muted-foreground">
              Los datos se obtienen de tifa.com.ar y se actualizan cada hora.
              <br />
              Intentá de nuevo más tarde.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">← Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { standings, fernetIndex, updatedAt } = data;
  const updatedTime = new Date(updatedAt).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            Tabla de Posiciones
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Cuarta División — TIFA · Apertura 2026
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableCaption>
              Datos de tifa.com.ar · Actualizado: {updatedTime}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-center">PTS</TableHead>
                <TableHead className="text-center">PJ</TableHead>
                <TableHead className="text-center">PG</TableHead>
                <TableHead className="text-center">PE</TableHead>
                <TableHead className="text-center">PP</TableHead>
                <TableHead className="text-center hidden sm:table-cell">
                  GF
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell">
                  GC
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell">
                  DIF
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row, i) => {
                const isFernet = i === fernetIndex;
                const inZone = row.position <= CLASSIFICATION_ZONE;

                return (
                  <TableRow
                    key={row.position}
                    className={
                      isFernet
                        ? "bg-accent/10 border-l-2 border-l-accent"
                        : inZone
                          ? "bg-emerald-500/3"
                          : ""
                    }
                  >
                    <TableCell className="text-center font-medium">
                      {inZone ? (
                        <Badge
                          className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs tabular-nums"
                        >
                          {row.position}
                        </Badge>
                      ) : (
                        <span className="tabular-nums">{row.position}</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        isFernet ? "font-bold text-accent" : ""
                      }
                    >
                      {row.team}
                      {isFernet && (
                        <Badge variant="gold" className="ml-2 text-[10px]">
                          Nosotros
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold tabular-nums">
                      {row.points}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.played}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.won}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.drawn}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.lost}
                    </TableCell>
                    <TableCell className="text-center tabular-nums hidden sm:table-cell">
                      {row.goalsFor}
                    </TableCell>
                    <TableCell className="text-center tabular-nums hidden sm:table-cell">
                      {row.goalsAgainst}
                    </TableCell>
                    <TableCell className="text-center tabular-nums hidden sm:table-cell">
                      {row.goalDifference > 0
                        ? `+${row.goalDifference}`
                        : row.goalDifference}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Back link */}
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
