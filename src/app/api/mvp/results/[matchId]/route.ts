import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createServerSupabaseClient();

  // Get match info
  const { data: match } = await supabase
    .from("matches")
    .select("id, status, opponent, updated_at")
    .eq("id", matchId)
    .single();

  if (!match) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  // Check if voting is still open
  const completedAt = new Date(match.updated_at);
  const deadline = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
  const isOpen = match.status === "completed" && new Date() <= deadline;

  // Get votes grouped by player
  const { data: votes } = await supabase
    .from("mvp_votes")
    .select("player_id, players!inner(nickname)")
    .eq("match_id", matchId);

  // Count votes per player
  const voteCounts: Record<string, { nickname: string; votes: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const vote of (votes ?? []) as any[]) {
    const pid = vote.player_id;
    if (!voteCounts[pid]) {
      voteCounts[pid] = { nickname: vote.players.nickname, votes: 0 };
    }
    voteCounts[pid].votes++;
  }

  // Sort by votes descending
  const results = Object.entries(voteCounts)
    .map(([player_id, data]) => ({ player_id, ...data }))
    .sort((a, b) => b.votes - a.votes);

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

  return NextResponse.json({
    match_id: matchId,
    opponent: match.opponent,
    is_open: isOpen,
    deadline: deadline.toISOString(),
    total_votes: totalVotes,
    results,
  });
}
