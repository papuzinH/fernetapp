"use client";

import { Button } from "@/components/ui/button";
import { markPaymentPaid, markPaymentPending } from "../matches/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Undo2 } from "lucide-react";

interface Props {
  paymentId: string;
  currentStatus: "pending" | "paid";
}

export function PaymentToggleButton({ paymentId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result =
        currentStatus === "pending"
          ? await markPaymentPaid(paymentId)
          : await markPaymentPending(paymentId);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return currentStatus === "pending" ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1"
    >
      <Check className="h-3.5 w-3.5" />
      {isPending ? "..." : "Marcar pagado"}
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="text-muted-foreground hover:text-foreground gap-1"
    >
      <Undo2 className="h-3.5 w-3.5" />
      {isPending ? "..." : "Deshacer"}
    </Button>
  );
}
