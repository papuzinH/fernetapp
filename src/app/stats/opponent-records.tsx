import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OpponentRecord } from "@/lib/supabase/types";

function formatDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Barra V/E/D apilada. Lleva los números al lado, así que el color nunca es
 *  el único portador del dato. */
function RecordBar({ record }: { record: OpponentRecord }) {
  const total = record.total_matches || 1;
  const segments = [
    { key: "V", value: record.wins, color: "var(--fcg-chart-win)" },
    { key: "E", value: record.draws, color: "var(--fcg-chart-draw)" },
    { key: "D", value: record.losses, color: "var(--fcg-chart-loss)" },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden>
      {segments.map((s) => (
        <div
          key={s.key}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  );
}

export function OpponentRecords({
  opponents,
  totalOpponents,
}: {
  opponents: OpponentRecord[];
  totalOpponents: number;
}) {
  if (!opponents.length) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground px-4">
          Todavía no se repitió ningún rival
          {totalOpponents > 0 && ` — los ${totalOpponents} enfrentados fueron distintos`}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        De los <span className="font-semibold text-foreground">{totalOpponents}</span>{" "}
        rivales enfrentados, estos{" "}
        <span className="font-semibold text-foreground">{opponents.length}</span> se
        repitieron. Al resto se lo jugó una sola vez.
      </p>

      {/* ── Desktop ── */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rival</TableHead>
              <TableHead className="text-center">PJ</TableHead>
              <TableHead className="text-center">V</TableHead>
              <TableHead className="text-center">E</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center">Efect.</TableHead>
              <TableHead className="text-center">Goles</TableHead>
              <TableHead className="text-right">Último</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opponents.map((o) => (
              <TableRow key={o.opponent_key}>
                <TableCell className="font-medium">
                  <div className="space-y-1.5 max-w-[220px]">
                    <span className="block truncate">{o.opponent}</span>
                    <RecordBar record={o} />
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {o.total_matches}
                </TableCell>
                <TableCell className="text-center tabular-nums font-semibold">
                  {o.wins}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {o.draws}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {o.losses}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {o.win_percentage}%
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {o.total_goals_for}:{o.total_goals_against}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {formatDate(o.last_played)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile ── */}
      <ul className="sm:hidden space-y-2">
        {opponents.map((o) => (
          <li key={o.opponent_key} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{o.opponent}</p>
                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                  {o.total_matches} PJ · {o.wins}V {o.draws}E {o.losses}D ·{" "}
                  {o.total_goals_for}:{o.total_goals_against}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-serif font-bold tabular-nums leading-none">
                  {o.win_percentage}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  Efect.
                </p>
              </div>
            </div>
            <RecordBar record={o} />
            <p className="text-[11px] text-muted-foreground">
              Último: {formatDate(o.last_played)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
