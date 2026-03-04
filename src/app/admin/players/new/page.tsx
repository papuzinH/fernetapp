import { PlayerForm } from "@/components/forms/player-form";

export default function NewPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo Jugador</h2>
        <p className="text-muted-foreground">
          Dar de alta un nuevo integrante del plantel.
        </p>
      </div>
      <PlayerForm />
    </div>
  );
}
