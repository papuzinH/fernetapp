"use client";

import { cn } from "@/lib/utils";

export interface SelectablePlayer {
  player_id: string;
  nickname: string;
}

interface RosterPickerProps {
  /** Ya ordenados por la view: apariciones recientes primero. */
  players: SelectablePlayer[];
  selectedIds: string[];
  onToggle: (playerId: string) => void;
  /** "Jugaron" para partidos completados, "Van" para programados. */
  playedLabel: string;
}

/**
 * Dos zonas de chips: los que jugaron arriba, el resto del plantel abajo.
 *
 * Tocar el nombre es el único gesto, igual en celular y en escritorio. El
 * orden dentro de cada zona es el del array recibido —el de la view— y no
 * el de selección: si fuera por orden de toque, corregir un error de marcado
 * reordenaría las filas de stats de abajo y movería de lugar la que se
 * estaba por completar.
 */
export function RosterPicker({
  players,
  selectedIds,
  onToggle,
  playedLabel,
}: RosterPickerProps) {
  const selected = players.filter((p) => selectedIds.includes(p.player_id));
  const available = players.filter((p) => !selectedIds.includes(p.player_id));

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {playedLabel}{" "}
          <span className="tabular-nums text-foreground">
            ({selected.length})
          </span>
        </h3>
        {selected.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
            Tocá un jugador para marcarlo.
          </p>
        ) : (
          <ChipGrid players={selected} onToggle={onToggle} isSelected />
        )}
      </section>

      {available.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resto del plantel
          </h3>
          <ChipGrid players={available} onToggle={onToggle} />
        </section>
      )}
    </div>
  );
}

function ChipGrid({
  players,
  onToggle,
  isSelected = false,
}: {
  players: SelectablePlayer[];
  onToggle: (playerId: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {players.map((p) => (
        <button
          key={p.player_id}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onToggle(p.player_id)}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium",
            "transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
            isSelected
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-input hover:bg-muted dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
          )}
        >
          {p.nickname}
        </button>
      ))}
    </div>
  );
}
