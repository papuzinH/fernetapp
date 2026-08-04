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

export type LeaderboardItem = {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  /** La métrica del ranking: la que ordena y la que se destaca */
  primary: number | string;
  /** Métricas de apoyo, en el orden en que se muestran */
  secondary: { label: string; value: number | string }[];
};

/**
 * Ranking de jugadores, en tabla o en cards según el ancho.
 *
 * El dashboard tenía la misma tabla de cinco columnas repetida tres veces
 * (goleadores, asistidores, MVPs), y en celular las cinco columnas se aplastan
 * hasta ser ilegibles — de ahí venían los parches de padding para robar aire.
 * Acá abajo de sm cada jugador es una fila con su número grande a la derecha.
 */
export function Leaderboard({
  items,
  primaryLabel,
  topBadge,
  emptyMessage,
}: {
  items: LeaderboardItem[];
  primaryLabel: string;
  /** Distintivo para el primer puesto, si corresponde */
  topBadge?: string;
  emptyMessage: string;
}) {
  if (!items.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8 px-4">
        {emptyMessage}
      </p>
    );
  }

  const medal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

  const secondaryLabels = items[0]?.secondary.map((s) => s.label) ?? [];

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Jugador</TableHead>
              {secondaryLabels.map((label) => (
                <TableHead key={label} className="text-center">
                  {label}
                </TableHead>
              ))}
              <TableHead className="text-center">{primaryLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{medal(i)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/players/${item.id}`}
                      className="hover:underline hover:text-accent"
                    >
                      {item.nickname}
                    </Link>
                    {i === 0 && topBadge && (
                      <Badge variant="default" className="text-[10px]">
                        {topBadge}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {item.secondary.map((s) => (
                  <TableCell
                    key={s.label}
                    className="text-center tabular-nums text-muted-foreground"
                  >
                    {s.value}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold tabular-nums">
                  {item.primary}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile ── */}
      <ul className="sm:hidden divide-y">
        {items.map((item, i) => (
          <li key={item.id}>
            <Link
              href={`/players/${item.id}`}
              className="flex items-center gap-3 py-2.5 active:bg-muted/50 transition-colors"
            >
              <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                {medal(i)}
              </span>
              <Avatar className="h-9 w-9 shrink-0">
                {item.avatar_url && (
                  <AvatarImage
                    src={item.avatar_url}
                    alt=""
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {item.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{item.nickname}</p>
                <p className="text-xs text-muted-foreground truncate tabular-nums">
                  {item.secondary.map((s) => `${s.value} ${s.label}`).join(" · ")}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xl font-serif font-bold tabular-nums leading-none">
                  {item.primary}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {primaryLabel}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
