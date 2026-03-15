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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlayer, updatePlayer } from "@/app/admin/players/actions";
import type { Player } from "@/lib/supabase/types";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface PlayerFormProps {
  existingPlayer?: Player;
}

export function PlayerForm({ existingPlayer }: PlayerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingPlayer?.avatar_url ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!existingPlayer;

  const form = useForm<PlayerFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(playerSchema) as any,
    defaultValues: {
      nickname: existingPlayer?.nickname ?? "",
      full_name: existingPlayer?.full_name ?? "",
      position: existingPlayer?.position ?? null,
      is_active: existingPlayer?.is_active ?? true,
      avatar_url: existingPlayer?.avatar_url ?? null,
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();

      const { error } = await supabase.storage
        .from("player-avatars")
        .upload(fileName, file, { upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("player-avatars")
        .getPublicUrl(fileName);

      form.setValue("avatar_url", publicUrl);
      setPreviewUrl(publicUrl);
      toast.success("Foto subida correctamente");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleRemoveAvatar() {
    form.setValue("avatar_url", null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
            <CardTitle className="font-serif">{isEditing ? "Editar Jugador" : "Nuevo Jugador"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col gap-3">
              <FormLabel>Foto del Jugador</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 shrink-0 ring-2 ring-border">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Avatar" className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg font-bold">
                    {form.watch("nickname")?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {avatarUploading ? "Subiendo..." : "Subir foto"}
                  </Button>
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-destructive"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-4 w-4" />
                      Quitar foto
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP · Máx. 2 MB
                  </p>
                </div>
              </div>
            </div>

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
