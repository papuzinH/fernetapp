"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteMatch } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  matchLabel: string;
}

export function MatchDeleteButton({ matchId, matchLabel }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar el partido "${matchLabel}"? Se borrarán también las stats de jugadores. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    const result = await deleteMatch(matchId);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
