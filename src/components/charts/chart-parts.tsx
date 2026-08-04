"use client";

import type { ReactNode } from "react";

/**
 * Piezas compartidas por los gráficos de /stats.
 *
 * Los colores no se pasan por props ni se leen del theme en JS: se escriben como
 * var(--fcg-chart-*) directo en los atributos SVG y el navegador resuelve cuál
 * corresponde según el modo. Un gráfico nunca "sabe" si está en claro u oscuro.
 */

export const CHART = {
  goalsFor: "var(--fcg-chart-gf)",
  goalsAgainst: "var(--fcg-chart-ga)",
  win: "var(--fcg-chart-win)",
  loss: "var(--fcg-chart-loss)",
  draw: "var(--fcg-chart-draw)",
  grid: "var(--fcg-chart-grid)",
  axis: "var(--fcg-chart-axis)",
} as const;

/** Ejes recesivos: sin línea, sin ticks, tipografía chica en tinta apagada */
export const axisProps = {
  stroke: CHART.axis,
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART.axis, fontSize: 11 },
} as const;

type TooltipRow = {
  label: string;
  value: ReactNode;
  /** Color de la marca que va al lado. El texto NUNCA se pinta con este color. */
  swatch?: string;
};

/** Caja del tooltip, con la misma superficie elevada que las Card de la app */
export function TooltipBox({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-popover-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {row.swatch && (
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-[2px] shrink-0"
                  style={{ background: row.swatch }}
                />
              )}
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-popover-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Leyenda propia en vez de la de Recharts, para que las etiquetas usen los
 * tokens de texto de la app y no el color de la serie.
 */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px] shrink-0"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Estado vacío, para que un gráfico sin datos no se vea como un gráfico roto */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground px-4 text-center">{message}</p>
    </div>
  );
}
