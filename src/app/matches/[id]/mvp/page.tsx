import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { MvpVoteClient } from "@/components/mvp-vote-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MvpVotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get match info
  const { data: match } = await supabase
    .from("matches")
    .select("id, opponent, date, status, tournaments(name)")
    .eq("id", matchId)
    .single();

  if (!match || match.status !== "completed") notFound();

  // Get players who played in this match
  const { data: stats } = await supabase
    .from("match_player_stats")
    .select("player_id, players!inner(nickname)")
    .eq("match_id", matchId)
    .eq("played", true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = (stats ?? []).map((s: any) => ({
    player_id: s.player_id as string,
    nickname: s.players.nickname as string,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tournamentName = (match as any).tournaments?.name ?? "";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
              <Star className="h-7 w-7 text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Figura del Partido</CardTitle>
          <p className="text-muted-foreground">
            vs {match.opponent} &middot; {match.date}
            {tournamentName && (
              <Badge variant="outline" className="ml-2 text-xs">
                {tournamentName}
              </Badge>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <MvpVoteClient matchId={matchId} players={players} />
        </CardContent>
      </Card>
    </div>
  );
}
