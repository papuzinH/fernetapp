import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FixtureFilters } from "@/app/dashboard/fixtures/fixture-filters";
import { CalendarClock, MapPin, Shield } from "lucide-react";
import type { Match, Tournament } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type MatchWithTournament = Match & {
  tournaments: { id: string; name: string; year: number } | null;
};

interface PageProps {
  searchParams: Promise<{ tournament?: string; year?: string; status?: string }>;
}

function OpponentAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-white/80">{initials}</span>
    </div>
  );
}

export default async function MatchesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: tournamentsData } = await supabase
    .from("tournaments")
    .select("*")
    .order("year", { ascending: false });

  const tournaments = (tournamentsData ?? []) as Tournament[];

  let query = supabase
    .from("matches")
    .select("*, tournaments(id, name, year)")
    .order("date", { ascending: false });

  if (params.tournament) {
    query = query.eq("tournament_id", params.tournament);
  }

  if (params.year) {
    const year = parseInt(params.year);
    query = query
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`);
  }

  const { data: matchesData } = await query;
  const allMatches = (matchesData ?? []) as unknown as MatchWithTournament[];

  const completedMatches = allMatches.filter((m) => m.status === "completed");
  const scheduledMatches = allMatches.filter((m) => m.status === "scheduled");

  const years = [...new Set(tournaments.map((t) => t.year))].sort(
    (a, b) => b - a
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold tracking-tight">
          Partidos
        </h1>
        <p className="text-muted-foreground">
          Todos los partidos de Fernet con Guaymallén
        </p>
      </div>

      <FixtureFilters
        tournaments={tournaments}
        years={years}
        currentTournament={params.tournament}
        currentYear={params.year}
      />

      {/* Próximos partidos */}
      {scheduledMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent" />
            Próximos Partidos
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scheduledMatches.map((m) => {
              const tournament = m.tournaments as unknown as {
                id: string;
                name: string;
                year: number;
              } | null;
              const matchDatetime = m.datetime ? new Date(m.datetime) : null;
              return (
                <Link key={m.id} href={`/matches/${m.id}`}>
                  <Card className="cursor-pointer h-full hover:scale-[0.98] active:scale-[0.96] transition-transform">
                    <CardContent className="pt-5 pb-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold" className="text-xs">
                          Programado
                        </Badge>
                        {tournament && (
                          <span className="text-xs text-muted-foreground truncate max-w-40">
                            {tournament.name} {tournament.year}
                          </span>
                        )}
                      </div>
                      <p className="font-serif font-bold text-lg leading-tight">
                        Fernet con Guaymallén{" "}
                        <span className="text-muted-foreground font-sans font-normal text-base">
                          vs
                        </span>{" "}
                        {m.opponent}
                      </p>
                      {matchDatetime && (
                        <p className="text-sm text-muted-foreground">
                          {matchDatetime.toLocaleDateString("es-AR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })}{" "}
                          —{" "}
                          {matchDatetime.toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          hs
                        </p>
                      )}
                      {m.location_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {m.location_name}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Partidos completados */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Últimos Partidos
        </h2>

        {completedMatches.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-center text-muted-foreground">
              No se encontraron partidos con los filtros seleccionados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedMatches.map((m) => {
              const tournament = m.tournaments as unknown as {
                id: string;
                name: string;
                year: number;
              } | null;

              const resultLabel =
                m.result === "V"
                  ? "Victoria"
                  : m.result === "E"
                    ? "Empate"
                    : "Derrota";
              const resultClasses =
                m.result === "V"
                  ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                  : m.result === "E"
                    ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20";
              const scoreColor =
                m.result === "V"
                  ? "text-emerald-400"
                  : m.result === "E"
                    ? "text-amber-400"
                    : "text-red-400";

              const dateStr = new Date(
                m.date + "T12:00:00"
              ).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              return (
                <Link key={m.id} href={`/matches/${m.id}`}>
                  <Card className="cursor-pointer h-full overflow-hidden py-0 gap-0 group hover:scale-[0.98] active:scale-[0.96] transition-transform">
                    {/* Header: fecha + torneo */}
                    <div className="bg-white/4 px-5 py-3 text-center border-b border-white/6">
                      <p className="text-xs font-semibold text-foreground/90 tracking-wide">
                        {dateStr}
                      </p>
                      {tournament && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {tournament.name} {tournament.year}
                        </p>
                      )}
                    </div>

                    {/* Cuerpo: equipos + marcador */}
                    <div className="px-5 py-6 flex items-center justify-between gap-4">
                      {/* Equipo local */}
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <Image
                          src="/Escudo Fernet 2023 PNG.png"
                          alt="Fernet con Guaymallén"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain drop-shadow-[0_0_8px_oklch(0.60_0.16_55/0.4)] group-hover:drop-shadow-[0_0_12px_oklch(0.60_0.16_55/0.6)] transition-all"
                        />
                        <span className="text-[11px] font-medium text-center text-foreground/80 leading-tight">
                          Fernet con
                          <br />
                          Guaymallén
                        </span>
                      </div>

                      {/* Marcador */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <span
                          className={`text-3xl font-black font-mono tracking-tight ${scoreColor}`}
                        >
                          {m.goals_for} - {m.goals_against}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${resultClasses}`}
                        >
                          {resultLabel}
                        </span>
                      </div>

                      {/* Equipo visitante */}
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        <OpponentAvatar name={m.opponent} />
                        <span className="text-[11px] font-medium text-center text-foreground/80 leading-tight">
                          {m.opponent}
                        </span>
                      </div>
                    </div>

                    {/* Footer: tarjetas (si hay) */}
                    {(m.yellow_cards > 0 || m.red_cards > 0) && (
                      <div className="px-5 pb-4 flex items-center justify-center gap-3 border-t border-white/6 pt-3">
                        {m.yellow_cards > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-400/80">
                            <span className="inline-block w-3 h-4 bg-amber-400 rounded-[2px]" />
                            {m.yellow_cards}
                          </span>
                        )}
                        {m.red_cards > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-400/80">
                            <span className="inline-block w-3 h-4 bg-red-500 rounded-[2px]" />
                            {m.red_cards}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
