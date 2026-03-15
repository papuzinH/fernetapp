import { fetchStandings } from "@/lib/services/scraper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, TrendingUp, Minus, TrendingDown } from "lucide-react";
import Link from "next/link";

const CLASSIFICATION_ZONE = 4;

export async function CurrentPositionWidget() {
  const data = await fetchStandings();

  if (!data?.fernetRow) return null;

  const { fernetRow, standings } = data;
  const totalTeams = standings.length;

  const zoneBadge =
    fernetRow.position <= CLASSIFICATION_ZONE ? (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
        Zona de Clasificación
      </Badge>
    ) : fernetRow.position <= 8 ? (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
        Zona Media
      </Badge>
    ) : (
      <Badge variant="outline">Fuera de Zona</Badge>
    );

  return (
    <Card className="relative border-accent/20 overflow-hidden hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_40px_oklch(0.60_0.16_55/0.08)]">
      {/* Gradient accent top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      {/* Subtle radial glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <CardContent className="pt-6 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Position info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Trophy className="h-5 w-5 text-accent" />
              <h3 className="font-bold text-lg">Posición Actual</h3>
              <Badge variant="outline" className="text-xs">
                Cuarta División
              </Badge>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-serif font-black text-accent tracking-tight">
                {fernetRow.position}°
              </span>
              <div>
                <p className="text-2xl font-bold">{fernetRow.points} pts</p>
                <p className="text-xs text-muted-foreground">
                  de {totalTeams} equipos
                </p>
              </div>
            </div>

            {zoneBadge}
          </div>

          {/* Right: Mini stats */}
          <div className="grid grid-cols-4 gap-3 lg:gap-5 text-center">
            {[
              { label: "PJ", value: fernetRow.played, icon: Swords, color: "" },
              { label: "PG", value: fernetRow.won, icon: TrendingUp, color: "text-emerald-400" },
              { label: "PE", value: fernetRow.drawn, icon: Minus, color: "text-amber-400" },
              { label: "PP", value: fernetRow.lost, icon: TrendingDown, color: "text-red-400" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <stat.icon
                  className={`h-3.5 w-3.5 mx-auto ${stat.color || "text-muted-foreground"}`}
                />
                <p className={`text-xl font-serif font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer link */}
        <div className="mt-5 pt-4 border-t border-border/50">
          <Link
            href="/posiciones"
            className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Ver tabla completa →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
