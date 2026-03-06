"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare } from "lucide-react";

interface PlayerItem {
  player_id: string;
  nickname: string;
  full_name?: string | null;
}

interface WhatsAppParserProps {
  players: PlayerItem[];
  onApply: (playerIds: string[]) => void;
}

/**
 * Cleans a WhatsApp group confirmation message and extracts names using
 * simple line-by-line parsing. Common patterns:
 *
 *  ✅ Lautaro
 *  👍 Facu
 *  - Nico
 *  1. Marcos
 *  Toto voy
 *  Juampi +1
 */
function extractNames(raw: string): string[] {
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const names: string[] = [];

  for (const line of lines) {
    // Strip timestamps like "[12:34, 1/2/2025]" or "12:34 -"
    let cleaned = line.replace(/^\[.*?\]\s*/, "").replace(/^\d{1,2}:\d{2}\s*-?\s*/, "");
    // Strip sender prefix "Name: message"
    const colonIdx = cleaned.indexOf(":");
    if (colonIdx > 0 && colonIdx < 30) {
      cleaned = cleaned.substring(colonIdx + 1).trim();
    }
    // Strip leading emoji indicators (✅ 👍 ⚽ 🔥 etc)
    cleaned = cleaned.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]+\s*/u, "");
    // Strip list markers: "1." "2." "-" "•"
    cleaned = cleaned.replace(/^[\d]+[.)]\s*/, "").replace(/^[-•]\s*/, "");
    // Strip trailing confirmations: "voy", "juego", "me anoto", "+1"
    cleaned = cleaned.replace(/\s*(voy|juego|me anoto|confirmo|va|dale|si|sí|ok|oka|\+\d+)$/i, "");
    // Final trim
    cleaned = cleaned.trim();

    if (cleaned.length >= 2 && cleaned.length <= 40) {
      names.push(cleaned);
    }
  }

  return [...new Set(names)];
}

export function WhatsAppParser({ players, onApply }: WhatsAppParserProps) {
  const [raw, setRaw] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fuse = useMemo(
    () =>
      new Fuse(players, {
        keys: ["nickname", "full_name"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [players]
  );

  const parsed = useMemo(() => {
    if (!raw.trim()) return [];
    const names = extractNames(raw);
    return names.map((name) => {
      const results = fuse.search(name);
      const best = results[0]?.item ?? null;
      return { name, match: best, score: results[0]?.score ?? 1 };
    });
  }, [raw, fuse]);

  // Auto-select good matches
  const autoSelected = useMemo(() => {
    const ids = new Set<string>();
    for (const p of parsed) {
      if (p.match && p.score < 0.35) {
        ids.add(p.match.player_id);
      }
    }
    return ids;
  }, [parsed]);

  const effectiveSelected = useMemo(() => {
    const merged = new Set(autoSelected);
    for (const id of selected) merged.add(id);
    // Remove manually deselected
    for (const id of autoSelected) {
      if (selected.has(`!${id}`)) merged.delete(id);
    }
    return merged;
  }, [autoSelected, selected]);

  function togglePlayer(playerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (effectiveSelected.has(playerId)) {
        // Deselect: if it was auto-selected, mark with "!" prefix
        if (autoSelected.has(playerId)) {
          next.add(`!${playerId}`);
        } else {
          next.delete(playerId);
        }
      } else {
        // Select
        next.delete(`!${playerId}`);
        next.add(playerId);
      }
      return next;
    });
  }

  function handleApply() {
    onApply([...effectiveSelected]);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Importar de WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar confirmados de WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder={"Pegá el mensaje del grupo de WhatsApp...\n\n✅ Lautaro\n👍 Facu\n- Nico voy"}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setSelected(new Set());
            }}
            rows={6}
          />

          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {parsed.length} líneas detectadas — {effectiveSelected.size} jugadores seleccionados
              </p>
              <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                {parsed.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"
                  >
                    {p.match ? (
                      <>
                        <Checkbox
                          checked={effectiveSelected.has(p.match.player_id)}
                          onCheckedChange={() => togglePlayer(p.match!.player_id)}
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium">{p.match.nickname}</span>
                          {p.match.full_name && (
                            <span className="text-muted-foreground ml-1">
                              ({p.match.full_name})
                            </span>
                          )}
                        </span>
                        <Badge
                          variant={p.score < 0.2 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          &larr; &quot;{p.name}&quot;
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Checkbox disabled checked={false} />
                        <span className="flex-1 text-sm text-muted-foreground line-through">
                          &quot;{p.name}&quot;
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          Sin match
                        </Badge>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                type="button"
                onClick={handleApply}
                disabled={effectiveSelected.size === 0}
              >
                Marcar {effectiveSelected.size} como &quot;Jugó&quot;
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
