"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, PenLine } from "lucide-react";
import Link from "next/link";

interface NextMatchActionsProps {
  matchId: string;
  canComplete: boolean;
  isPast: boolean;
  whatsappUrl: string;
}

export function NextMatchActions({ matchId, canComplete, isPast, whatsappUrl }: NextMatchActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
      {canComplete ? (
        <Link href={`/admin/matches/${matchId}/edit`}>
          <Button size="sm" className="gap-2">
            <PenLine className="h-4 w-4" />
            Completar Estadísticas
          </Button>
        </Link>
      ) : !isPast ? (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
            <MessageCircle className="h-4 w-4" />
            Compartir por WhatsApp
          </Button>
        </a>
      ) : null}
    </div>
  );
}
