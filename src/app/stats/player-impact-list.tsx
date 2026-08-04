import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PlayerImpact } from "@/lib/supabase/types";

/**
 * Cómo le va al equipo con cada jugador en cancha.
 *
 * Se ordena por points_percentage (3 por victoria, 1 por empate) y no por % de
 * victorias, porque con muchos empates el % de victorias puro miente: alguien
 * con 4 empates y 1 victoria de 5 no rindió igual que alguien con 4 derrotas.
 *
 * La barra es de ancho proporcional a los puntos y va acompañada del número,
 * así que el largo nunca es el único portador del dato.
 */
export function PlayerImpactList({ players }: { players: PlayerImpact[] }) {
  if (!players.length) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground px-4">
          Todavía no hay jugadores con suficientes partidos para medir impacto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Rendimiento del equipo con cada jugador en cancha, en porcentaje de puntos
        obtenidos. Solo jugadores con 5 partidos o más.
      </p>

      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.player_id}>
            <Link
              href={`/players/${p.player_id}`}
              className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
            >
              <Avatar className="h-9 w-9 shrink-0">
                {p.avatar_url && (
                  <AvatarImage src={p.avatar_url} alt="" className="object-cover" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
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

                {/* Barra proporcional — decorativa: el número está al lado */}
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, Number(p.points_percentage) || 0)}%`,
                      background: "var(--fcg-chart-win)",
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {p.matches_played} PJ · {p.wins}V {p.draws}E {p.losses}D ·{" "}
                  {p.team_goal_difference > 0 ? "+" : ""}
                  {p.team_goal_difference} dif.
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xl font-serif font-bold tabular-nums leading-none">
                  {p.points_percentage}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Puntos
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
