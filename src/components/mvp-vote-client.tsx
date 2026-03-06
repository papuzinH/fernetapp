"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Trophy, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface MvpVoteClientProps {
  matchId: string;
  players: { player_id: string; nickname: string }[];
}

interface VoteResult {
  player_id: string;
  nickname: string;
  votes: number;
}

interface ResultsData {
  is_open: boolean;
  deadline: string;
  total_votes: number;
  results: VoteResult[];
  opponent: string;
}

function getDeviceId(): string {
  const key = "fernetapp_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function MvpVoteClient({ matchId, players }: MvpVoteClientProps) {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/mvp/results/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    const votedKey = `mvp_voted_${matchId}`;
    setHasVoted(localStorage.getItem(votedKey) === "true");
    fetchResults();
  }, [matchId, fetchResults]);

  async function handleVote(playerId: string) {
    setVoting(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch("/api/mvp/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          player_id: playerId,
          device_id: deviceId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`mvp_voted_${matchId}`, "true");
        setHasVoted(true);
        toast.success("¡Voto registrado! 🌟");
        fetchResults();
      } else {
        toast.error(data.error || "Error al votar");
        if (res.status === 409) {
          setHasVoted(true);
          localStorage.setItem(`mvp_voted_${matchId}`, "true");
        }
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const isOpen = results?.is_open ?? false;
  const showResults = hasVoted || !isOpen;
  const maxVotes = results?.results.reduce((max, r) => Math.max(max, r.votes), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center gap-2 text-sm">
        {isOpen ? (
          <>
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">Votación abierta</span>
            {results?.deadline && (
              <span className="text-muted-foreground">
                — cierra {new Date(results.deadline).toLocaleString("es-AR")}
              </span>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Votación cerrada</span>
          </>
        )}
        {results && results.total_votes > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {results.total_votes} voto{results.total_votes !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Voting & Results */}
      {showResults ? (
        <div className="space-y-3">
          {hasVoted && isOpen && (
            <p className="text-sm text-muted-foreground">
              ¡Ya votaste! Estos son los resultados parciales:
            </p>
          )}
          {results?.results && results.results.length > 0 ? (
            results.results.map((r, idx) => (
              <Card
                key={r.player_id}
                className={idx === 0 && !isOpen && maxVotes > 0
                  ? "border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20"
                  : ""
                }
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="font-bold">
                      {r.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{r.nickname}</span>
                      {idx === 0 && !isOpen && maxVotes > 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: results.total_votes > 0
                            ? `${(r.votes / results.total_votes) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold tabular-nums shrink-0">
                    {r.votes}
                  </span>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nadie votó todavía.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map((p) => (
            <Card key={p.player_id} className="hover:border-accent/50 transition-colors">
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback className="font-bold">
                    {p.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold flex-1 truncate">{p.nickname}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  disabled={voting}
                  onClick={() => handleVote(p.player_id)}
                >
                  <Star className="h-4 w-4" />
                  Votar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
