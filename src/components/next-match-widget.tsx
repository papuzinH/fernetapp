import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, MapPin, Clock, MessageCircle, PenLine } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import type { Match } from "@/lib/supabase/types";

type MatchWithTournament = Match & { tournaments: { name: string } | null };

export async function NextMatchWidget() {
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nextMatch } = await supabase
    .from("matches")
    .select("*, tournaments(name)")
    .eq("status", "scheduled")
    .not("datetime", "is", null)
    .order("datetime", { ascending: true })
    .limit(1)
    .single() as { data: MatchWithTournament | null };

  if (!nextMatch) {
    return null;
  }

  const matchDatetime = new Date(nextMatch.datetime!);
  const now = new Date();
  const isPast = matchDatetime < now;

  // Format for display
  const formattedDate = format(matchDatetime, "EEEE d 'de' MMMM", { locale: es });
  const formattedTime = format(matchDatetime, "HH:mm");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tournamentName = (nextMatch as any).tournaments?.name ?? "";

  // WhatsApp share message
  const whatsappMessage = encodeURIComponent(
    `¡Se juega! ⚽ Fernet FC vs ${nextMatch.opponent}. 📍 ${nextMatch.location_name || "Lugar a confirmar"}. ⏰ ${formattedDate} ${formattedTime}hs. ¡Dale Fernet! 🌿`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-transparent overflow-hidden">
      <CardContent className="pt-6 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Match info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-accent" />
              <h3 className="font-bold text-lg">Próximo Partido</h3>
              {tournamentName && (
                <Badge variant="outline" className="text-xs">
                  {tournamentName}
                </Badge>
              )}
            </div>

            <p className="text-2xl sm:text-3xl font-black tracking-tight">
              Fernet FC <span className="text-muted-foreground font-normal">vs</span>{" "}
              {nextMatch.opponent}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formattedDate} — {formattedTime}hs
              </span>
              {nextMatch.location_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {nextMatch.location_name}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {isPast ? (
                <Link href={`/admin/matches/${nextMatch.id}/edit`}>
                  <Button size="sm" className="gap-2">
                    <PenLine className="h-4 w-4" />
                    Ingresar Estadísticas
                  </Button>
                </Link>
              ) : (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4" />
                    Compartir por WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Right: Countdown */}
          {!isPast && (
            <div className="lg:text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Faltan
              </p>
              <CountdownTimer targetDate={nextMatch.datetime!} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
