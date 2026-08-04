import Link from "next/link";
import { getPublicPlayers } from "@/lib/supabase/queries/players";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const positionLabel: Record<string, string> = {
  ARQ: "Arquero",
  DEF: "Defensor",
  MED: "Mediocampista",
  DEL: "Delantero",
};

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPublicPlayers();

  const active = players.filter((p) => p.is_active);
  const inactive = players.filter((p) => !p.is_active);

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif font-bold tracking-tight">Jugadores</h1>
        <p className="text-muted-foreground mt-1.5">
          El plantel histórico de Fernet con Guaymallén
        </p>
      </div>

      {/* Plantel activo */}
      <section>
        <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
          Plantel Activo
          <Badge variant="gold">{active.length}</Badge>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {active.map((player) => (
            <Link key={player.player_id} href={`/players/${player.player_id}`}>
              <Card className="hover:border-accent/40 cursor-pointer h-full group">
                <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-2.5">
                  <Avatar className="h-14 w-14 text-lg font-bold ring-2 ring-transparent group-hover:ring-accent/40 transition-all duration-300">
                    {player.avatar_url && (
                      <AvatarImage src={player.avatar_url} alt={player.nickname} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5 w-full">
                    <p className="font-semibold text-sm leading-tight line-clamp-1">
                      {player.nickname}
                    </p>
                    {player.full_name && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {player.full_name}
                      </p>
                    )}
                  </div>
                  {player.position && (
                    <Badge variant="outline" className="text-xs">
                      {positionLabel[player.position] ?? player.position}
                    </Badge>
                  )}
                  {/* 2×2 en celular, una fila de 4 desde sm: las cards son
                      angostas en mobile y cuatro columnas dejan los números
                      pegados. */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-1 gap-y-2 w-full mt-1 text-center">
                    <div>
                      <p className="text-sm font-bold tabular-nums">{player.matches_played}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">PJ</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums">{player.total_goals}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Goles</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums">{player.total_assists}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Asist.</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums">{player.mvp_count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">⭐ MVP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Jugadores retirados / inactivos */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-muted-foreground">
            Jugadores Retirados
            <Badge variant="secondary">{inactive.length}</Badge>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {inactive.map((player) => (
              <Link
                key={player.player_id}
                href={`/players/${player.player_id}`}
              >
                <Card className="cursor-pointer h-full opacity-60 hover:opacity-100 transition-all duration-300">
                  <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-2.5">
                    <Avatar className="h-14 w-14">
                      {player.avatar_url && (
                        <AvatarImage src={player.avatar_url} alt={player.nickname} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-muted text-muted-foreground text-base font-bold">
                        {player.nickname.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 w-full">
                      <p className="font-semibold text-sm leading-tight line-clamp-1">
                        {player.nickname}
                      </p>
                      {player.full_name && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {player.full_name}
                        </p>
                      )}
                    </div>
                    {player.position && (
                      <Badge variant="secondary" className="text-xs">
                        {positionLabel[player.position] ?? player.position}
                      </Badge>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-1 gap-y-2 w-full mt-1 text-center">
                      <div>
                        <p className="text-sm font-bold tabular-nums">{player.matches_played}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">PJ</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold tabular-nums">{player.total_goals}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Goles</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold tabular-nums">{player.total_assists}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Asist.</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold tabular-nums">{player.mvp_count}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">⭐ MVP</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
