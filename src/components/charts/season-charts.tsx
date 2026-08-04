"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamSeasonEvolution } from "@/lib/supabase/types";
import {
  CHART,
  ChartEmpty,
  ChartLegend,
  TooltipBox,
  axisProps,
} from "@/components/charts/chart-parts";

// Recharts no exporta un tipo público cómodo para el content del Tooltip.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipArgs = any;

type SeasonPoint = Partial<TeamSeasonEvolution> & { season_year: number };

/**
 * Inserta los años sin partidos como huecos explícitos.
 *
 * El equipo no jugó en 2025, y sin esto la serie va 2023 → 2024 → 2026 con el
 * eje repartido en tres tramos iguales: la línea uniría 2024 con 2026 como si
 * fueran consecutivos y el salto quedaría invisible. Con el año presente y en
 * null, Recharts corta la línea y el hueco se ve.
 */
function fillSeasonGaps(data: TeamSeasonEvolution[]): SeasonPoint[] {
  if (data.length < 2) return data;

  const byYear = new Map(data.map((d) => [d.season_year, d]));
  const from = data[0].season_year;
  const to = data[data.length - 1].season_year;

  const out: SeasonPoint[] = [];
  for (let year = from; year <= to; year++) {
    out.push(byYear.get(year) ?? { season_year: year });
  }
  return out;
}

/**
 * Efectividad por año — una sola serie, así que no lleva leyenda: el título
 * del bloque ya dice qué se está mirando.
 */
export function EfficiencyTrendChart({ data }: { data: TeamSeasonEvolution[] }) {
  if (data.length < 2) {
    return (
      <ChartEmpty message="Hace falta al menos dos temporadas cargadas para dibujar la evolución." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={fillSeasonGaps(data)}
        margin={{ top: 8, right: 16, bottom: 4, left: -18 }}
      >
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="season_year" {...axisProps} />
        <YAxis
          {...axisProps}
          // Escala completa a propósito: con valores entre 47% y 55%, recortar
          // el eje al rango de los datos convertiría una temporada estable en
          // un serrucho dramático. Que se vea plano es el dato.
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          width={46}
        />
        <Tooltip
          cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload }: TooltipArgs) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as SeasonPoint;
            if (d.win_percentage == null) {
              return (
                <TooltipBox
                  title={String(d.season_year)}
                  subtitle="Sin partidos en el año"
                  rows={[]}
                />
              );
            }
            return (
              <TooltipBox
                title={String(d.season_year)}
                subtitle={`${d.total_matches} ${d.total_matches === 1 ? "partido" : "partidos"}`}
                rows={[
                  { label: "Efectividad", value: `${d.win_percentage}%` },
                  {
                    label: "Resultados",
                    value: `${d.wins}V · ${d.draws}E · ${d.losses}D`,
                  },
                ]}
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="win_percentage"
          stroke={CHART.goalsFor}
          strokeWidth={2}
          // Sin esto la línea saltaría el año vacío y lo haría invisible
          connectNulls={false}
          dot={{ r: 4, fill: CHART.goalsFor, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--background)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Goles a favor y en contra por temporada.
 *
 * Las dos series comparten escala (son goles), así que van en UN solo eje.
 * Nunca en dos ejes: dos escalas distintas en el mismo dibujo hacen que el
 * cruce de las líneas parezca significar algo cuando no significa nada.
 */
export function GoalsBySeasonChart({ data }: { data: TeamSeasonEvolution[] }) {
  if (!data.length) {
    return <ChartEmpty message="Todavía no hay partidos completados para graficar." />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={fillSeasonGaps(data)}
          margin={{ top: 8, right: 12, bottom: 4, left: -18 }}
        >
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="season_year" {...axisProps} />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: CHART.grid }}
            content={({ active, payload }: TooltipArgs) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as SeasonPoint;
              if (d.total_goals_for == null) {
                return (
                  <TooltipBox
                    title={String(d.season_year)}
                    subtitle="Sin partidos en el año"
                    rows={[]}
                  />
                );
              }
              const diff = d.goal_difference ?? 0;
              return (
                <TooltipBox
                  title={String(d.season_year)}
                  subtitle={`${d.total_matches} ${d.total_matches === 1 ? "partido" : "partidos"}`}
                  rows={[
                    {
                      label: "A favor",
                      value: d.total_goals_for,
                      swatch: CHART.goalsFor,
                    },
                    {
                      label: "En contra",
                      value: d.total_goals_against,
                      swatch: CHART.goalsAgainst,
                    },
                    {
                      label: "Diferencia",
                      value: `${diff > 0 ? "+" : ""}${diff}`,
                    },
                  ]}
                />
              );
            }}
          />
          {/* El gap de 2px entre barras adyacentes lo da barGap */}
          <Bar
            dataKey="total_goals_for"
            fill={CHART.goalsFor}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="total_goals_against"
            fill={CHART.goalsAgainst}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: "Goles a favor", color: CHART.goalsFor },
          { label: "Goles en contra", color: CHART.goalsAgainst },
        ]}
      />
    </div>
  );
}

export type RecentFormMatch = {
  id: string;
  date: string;
  opponent: string;
  result: string;
  goals_for: number;
  goals_against: number;
};

/**
 * Forma reciente como diferencia de gol por partido.
 *
 * Va divergente (arriba ganaste, abajo perdiste, cero es empate) en vez de una
 * tira de tres colores V/E/D a propósito: verde–ámbar–rojo a luminosidad pareja
 * es indistinguible con daltonismo deuteranope, y acá el signo de la barra ya
 * dice el resultado sin depender del color. De paso muestra por cuánto, no solo
 * si se ganó.
 */
export function RecentFormChart({ data }: { data: RecentFormMatch[] }) {
  if (!data.length) {
    return <ChartEmpty message="Todavía no hay partidos completados para graficar." />;
  }

  const chartData = data.map((m) => ({
    ...m,
    diff: m.goals_for - m.goals_against,
    shortDate: new Date(m.date + "T12:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 12, bottom: 4, left: -22 }}
        >
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="shortDate" {...axisProps} interval="preserveStartEnd" />
          <YAxis {...axisProps} width={36} allowDecimals={false} />
          <ReferenceLine y={0} stroke={CHART.axis} strokeWidth={1} />
          <Tooltip
            cursor={{ fill: CHART.grid }}
            content={({ active, payload }: TooltipArgs) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof chartData)[number];
              const label =
                d.result === "V" ? "Victoria" : d.result === "E" ? "Empate" : "Derrota";
              return (
                <TooltipBox
                  title={`vs ${d.opponent}`}
                  subtitle={new Date(d.date + "T12:00:00").toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  rows={[
                    { label: "Resultado", value: label },
                    { label: "Marcador", value: `${d.goals_for} - ${d.goals_against}` },
                    {
                      label: "Diferencia",
                      value: `${d.diff > 0 ? "+" : ""}${d.diff}`,
                    },
                  ]}
                />
              );
            }}
          />
          {/* Radio uniforme y no solo en el extremo del dato: acá las barras
              salen para los dos lados del cero, y redondear por signo exige un
              path a mano que no aporta lo que cuesta. */}
          <Bar dataKey="diff" maxBarSize={26} radius={4}>
            {chartData.map((m) => (
              <Cell
                key={m.id}
                fill={
                  m.diff > 0 ? CHART.win : m.diff < 0 ? CHART.loss : CHART.draw
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: "Victoria", color: CHART.win },
          { label: "Empate", color: CHART.draw },
          { label: "Derrota", color: CHART.loss },
        ]}
      />
    </div>
  );
}
