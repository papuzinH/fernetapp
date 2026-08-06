"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface SaveWarningsDialogProps {
  open: boolean;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación de lo que se va a perder al guardar.
 *
 * Solo aparece si hay algo que advertir: la carga normal no gana un paso.
 */
export function SaveWarningsDialog({
  open,
  warnings,
  onConfirm,
  onCancel,
}: SaveWarningsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Al guardar se van a perder estos datos
          </DialogTitle>
          <DialogDescription>
            Revisá antes de continuar. Si algo está mal, volvé y corregilo.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {warnings.map((warning, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">·</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Volver
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Guardar igual
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
