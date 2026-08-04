"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerStatsRow } from "@/lib/supabase/queries/stats";

type SortKey =
  | "total_goals"
  | "total_assists"
  | "goal_contributions"
  | "matches_played"
  | "goals_per_match"
  | "mvp_count";

const COLUMNS: { key: SortKey; label: string; short: string; hint: string }[] = [
  { key: "matches_played", label: "Partidos jugados", short: "PJ", hint: "PJ" },
  { key: "total_goals", label: "Goles", short: "Goles", hint: "G" },
  { key: "total_assists", label: "Asistencias", short: "Asist.", hint: "A" },
  {
    key: "goal_contributions",
    label: "Participaciones en gol",
    short: "G+A",
    hint: "G+A",
  },
  { key: "goals_per_match", label: "Goles por partido", short: "Prom.", hint: "Prom." },
  { key: "mvp_count", label: "Veces MVP", short: "MVP", hint: "MVP" },
];

const positionLabel: Record<string, string> = {
  ARQ: "Arquero",
  DEF: "Defensor",
  MED: "Mediocampista",
  DEL: "Delantero",
};

function medal(index: number) {
  return index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
}

export function PlayerStatsTable({ players }: { players: PlayerStatsRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("total_goals");
  const [onlyActive, setOnlyActive] = useState(false);

  const sorted = useMemo(() => {
    const list = onlyActive ? players.filter((p) => p.is_active) : players;
    return [...list].sort((a, b) => {
      const diff = Number(b[sortKey]) - Number(a[sortKey]);
      // Desempate estable por partidos jugados y después alfabético, para que
      // el orden no baile entre renders cuando hay empate en la métrica.
      if (diff !== 0) return diff;
      const byMatches = b.matches_played - a.matches_played;
      if (byMatches !== 0) return byMatches;
      return a.nickname.localeCompare(b.nickname, "es");
    });
  }, [players, sortKey, onlyActive]);

  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No hay stats de jugadores para este filtro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles: en mobile el orden se elige acá, porque no hay headers donde tocar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5 sm:hidden">
          {COLUMNS.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => setSortKey(col.key)}
              aria-pressed={sortKey === col.key}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                sortKey === col.key
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "text-muted-foreground active:bg-muted"
              )}
            >
              {col.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOnlyActive((v) => !v)}
          aria-pressed={onlyActive}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ml-auto",
            onlyActive
              ? "border-accent/40 bg-accent/15 text-accent"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Solo plantel activo
        </button>
      </div>

      {/* ── Desktop: tabla ordenable ── */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Jugador</TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-center">
                  <button
                    type="button"
                    onClick={() => setSortKey(col.key)}
                    title={`Ordenar por ${col.label.toLowerCase()}`}
                    aria-label={`Ordenar por ${col.label.toLowerCase()}`}
                    className={cn(
                      "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                      sortKey === col.key ? "text-accent font-semibold" : ""
                    )}
                  >
                    {col.short}
                    {sortKey === col.key && <ArrowDown className="h-3 w-3" />}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p, i) => (
              <TableRow key={p.player_id}>
                <TableCell className="font-medium">{medal(i) ?? i + 1}</TableCell>
                <TableCell>
                  <Link
                    href={`/players/${p.player_id}`}
                    className="flex items-center gap-2.5 hover:text-accent"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      {p.avatar_url && (
                        <AvatarImage
                          src={p.avatar_url}
                          alt=""
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                        {p.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.nickname}</span>
                    {!p.is_active && (
                      <Badge variant="secondary" className="text-[10px]">
                        Retirado
                      </Badge>
                    )}
                  </Link>
                </TableCell>
                {COLUMNS.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      "text-center tabular-nums",
                      sortKey === col.key
                        ? "font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    {p[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile: una card por jugador ──
          La tabla de 8 columnas no entra en un celular; comprimirla la vuelve
          ilegible. Acá cada jugador es una fila con su métrica ordenada
          destacada y el resto en segundo plano. */}
      <ul className="sm:hidden space-y-2">
        {sorted.map((p, i) => {
          const highlighted = COLUMNS.find((c) => c.key === sortKey)!;
          const rest = COLUMNS.filter((c) => c.key !== sortKey);
          return (
            <li key={p.player_id}>
              <Link
                href={`/players/${p.player_id}`}
                className="flex items-center gap-3 rounded-xl border p-3 active:bg-muted/50 transition-colors"
              >
                <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                  {medal(i) ?? i + 1}
                </span>
                <Avatar className="h-10 w-10 shrink-0">
                  {p.avatar_url && (
                    <AvatarImage src={p.avatar_url} alt="" className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {p.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{p.nickname}</p>
                    {!p.is_active && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                        Retirado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.position ? positionLabel[p.position] ?? p.position : "—"}
                    {" · "}
                    {rest
                      .slice(0, 3)
                      .map((c) => `${p[c.key]} ${c.hint}`)
                      .join(" · ")}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xl font-serif font-bold tabular-nums leading-none">
                    {p[sortKey]}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {highlighted.short}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
