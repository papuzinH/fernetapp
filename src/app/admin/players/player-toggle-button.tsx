"use client";

import { Button } from "@/components/ui/button";
import { togglePlayerActive } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  playerId: string;
  isActive: boolean;
}

export function PlayerToggleButton({ playerId, isActive }: Props) {
  const router = useRouter();

  async function handleToggle() {
    const result = await togglePlayerActive(playerId, !isActive);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle}>
      {isActive ? "Desactivar" : "Activar"}
    </Button>
  );
}
