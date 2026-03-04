"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { playerSchema, type PlayerFormValues } from "@/lib/schemas/player";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlayer, updatePlayer } from "@/app/admin/players/actions";
import type { Player } from "@/lib/supabase/types";
import { useState } from "react";

interface PlayerFormProps {
  existingPlayer?: Player;
}

export function PlayerForm({ existingPlayer }: PlayerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingPlayer;

  const form = useForm<PlayerFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(playerSchema) as any,
    defaultValues: {
      nickname: existingPlayer?.nickname ?? "",
      full_name: existingPlayer?.full_name ?? "",
      position: existingPlayer?.position ?? null,
      is_active: existingPlayer?.is_active ?? true,
    },
  });

  async function onSubmit(data: PlayerFormValues) {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updatePlayer(existingPlayer!.id, data)
        : await createPlayer(data);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/players");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Editar Jugador" : "Nuevo Jugador"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apodo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Lolo, Pitu, Ian..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posición</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar posición" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARQ">Arquero</SelectItem>
                      <SelectItem value="DEF">Defensor</SelectItem>
                      <SelectItem value="MED">Mediocampista</SelectItem>
                      <SelectItem value="DEL">Delantero</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Jugador activo</FormLabel>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? "Guardar Cambios" : "Crear Jugador"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
