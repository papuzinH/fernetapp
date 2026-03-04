"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteTournament } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  tournamentId: string;
  tournamentName: string;
}

export function TournamentDeleteButton({ tournamentId, tournamentName }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Eliminar el torneo "${tournamentName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const result = await deleteTournament(tournamentId);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
