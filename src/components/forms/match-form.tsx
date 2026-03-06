"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { matchSchema, type MatchFormValues } from "@/lib/schemas/match";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMatch, updateMatch } from "@/app/admin/matches/actions";
import type { Tournament, Player, Match, MatchPlayerStats } from "@/lib/supabase/types";
import { useState, useMemo } from "react";
import { WhatsAppParser } from "@/components/whatsapp-parser";

interface MatchFormProps {
  tournaments: Tournament[];
  players: Player[];
  // For editing
  existingMatch?: Match;
  existingStats?: MatchPlayerStats[];
}

export function MatchForm({
  tournaments,
  players,
  existingMatch,
  existingStats,
}: MatchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingMatch;

  // Build default player stats from players list
  const defaultPlayerStats = players.map((p) => {
    const existing = existingStats?.find((s) => s.player_id === p.id);
    return {
      player_id: p.id,
      nickname: p.nickname,
      played: existing?.played ?? false,
      goals: existing?.goals ?? 0,
      assists: existing?.assists ?? 0,
      yellow_cards: existing?.yellow_cards ?? 0,
      red_cards: existing?.red_cards ?? 0,
    };
  });

  const form = useForm<MatchFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(matchSchema) as any,
    defaultValues: {
      date: existingMatch?.date ?? "",
      tournament_id: existingMatch?.tournament_id ?? "",
      opponent: existingMatch?.opponent ?? "",
      goals_for: existingMatch?.goals_for ?? 0,
      goals_against: existingMatch?.goals_against ?? 0,
      yellow_cards: existingMatch?.yellow_cards ?? 0,
      red_cards: existingMatch?.red_cards ?? 0,
      video_url: existingMatch?.video_url ?? "",
      notes: existingMatch?.notes ?? "",
      status: existingMatch?.status ?? "completed",
      location_name: existingMatch?.location_name ?? "",
      location_address: existingMatch?.location_address ?? "",
      datetime: existingMatch?.datetime ?? "",
      pitch_price: existingMatch?.pitch_price ?? undefined,
      player_stats: defaultPlayerStats,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "player_stats",
  });

  const goalsFor = form.watch("goals_for");
  const goalsAgainst = form.watch("goals_against");
  const playerStats = form.watch("player_stats");
  const matchStatus = form.watch("status");

  const resultPreview = useMemo(() => {
    const gf = Number(goalsFor) || 0;
    const ga = Number(goalsAgainst) || 0;
    if (gf > ga) return { label: "VICTORIA", color: "bg-green-100 text-green-800" };
    if (gf === ga) return { label: "EMPATE", color: "bg-yellow-100 text-yellow-800" };
    return { label: "DERROTA", color: "bg-red-100 text-red-800" };
  }, [goalsFor, goalsAgainst]);

  // Sum of individual goals vs team goals_for
  const totalPlayerGoals = useMemo(() => {
    return (playerStats ?? []).reduce(
      (sum, ps) => sum + (ps.played ? Number(ps.goals) || 0 : 0),
      0
    );
  }, [playerStats]);

  const goalsMismatch =
    totalPlayerGoals > 0 &&
    Number(goalsFor) > 0 &&
    totalPlayerGoals !== Number(goalsFor);

  async function onSubmit(data: MatchFormValues) {
    setIsSubmitting(true);
    try {
      // Para partidos programados, limpiar stats que no aplican
      const submitData =
        data.status === "scheduled"
          ? {
              ...data,
              goals_for: 0,
              goals_against: 0,
              yellow_cards: 0,
              red_cards: 0,
              video_url: "",
              notes: "",
              player_stats: (data.player_stats ?? []).map((ps) => ({
                ...ps,
                goals: 0,
                assists: 0,
                yellow_cards: 0,
                red_cards: 0,
              })),
            }
          : data;

      const result = isEditing
        ? await updateMatch(existingMatch!.id, submitData)
        : await createMatch(submitData);

      if (result.success) {
        toast.success(result.message);
        router.push("/admin/matches");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Error inesperado al guardar el partido");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Sección A — Datos del partido */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Partido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status + basic fields */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Programado</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Torneo */}
              <FormField
                control={form.control}
                name="tournament_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Torneo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar torneo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tournaments.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rival */}
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rival</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Scarlett FC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phase 2: DateTime + Location (shown for scheduled matches) */}
            {matchStatus === "scheduled" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <FormField
                  control={form.control}
                  name="datetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Cancha Diaz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Av. San Martín 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Resultado (only for completed matches) */}
            {matchStatus === "completed" && <div className="flex flex-wrap items-end gap-4">
              <FormField
                control={form.control}
                name="goals_for"
                render={({ field }) => (
                  <FormItem className="w-28">
                    <FormLabel>Goles FCG</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="text-center text-lg font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pb-2 text-xl font-bold text-muted-foreground">
                —
              </div>
              <FormField
                control={form.control}
                name="goals_against"
                render={({ field }) => (
                  <FormItem className="w-28">
                    <FormLabel>Goles Rival</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="text-center text-lg font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {matchStatus === "completed" && (
                <Badge className={`mb-2 ${resultPreview.color}`}>
                  {resultPreview.label} {goalsFor}-{goalsAgainst}
                </Badge>
              )}
            </div>}

            {matchStatus === "completed" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="yellow_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🟨 Amarillas</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="red_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>🟥 Rojas</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Video (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pitch_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Cancha ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Ej: 25000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            )}

            {matchStatus === "completed" && (
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: No se presentaron, suspendido por lluvia..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}
          </CardContent>
        </Card>

        {/* Sección B — Stats individuales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                Stats de Jugadores
                <WhatsAppParser
                  players={players.filter((p) => p.is_active).map((p) => ({
                    player_id: p.id,
                    nickname: p.nickname,
                    full_name: p.full_name,
                  }))}
                  onApply={(ids) => {
                    const stats = form.getValues("player_stats") ?? [];
                    stats.forEach((_, idx) => {
                      form.setValue(
                        `player_stats.${idx}.played`,
                        ids.includes(stats[idx].player_id)
                      );
                    });
                  }}
                />
              </span>
              {goalsMismatch && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️ Goles individuales ({totalPlayerGoals}) ≠ Goles del equipo (
                  {goalsFor})
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vista desktop — tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      {matchStatus === "scheduled" ? "Va" : "Jugó"}
                    </TableHead>
                    <TableHead>Jugador</TableHead>
                    {matchStatus === "completed" && (
                      <>
                        <TableHead className="w-20 text-center">Goles</TableHead>
                        <TableHead className="w-20 text-center">Asist.</TableHead>
                        <TableHead className="w-20 text-center">🟨</TableHead>
                        <TableHead className="w-20 text-center">🟥</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const isPlayed = form.watch(
                      `player_stats.${index}.played`
                    );
                    return (
                      <TableRow
                        key={field.id}
                        className={isPlayed ? "" : "opacity-40"}
                      >
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`player_stats.${index}.played`}
                            render={({ field: checkField }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={checkField.value}
                                    onCheckedChange={checkField.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Label className="font-medium">
                            {field.nickname}
                          </Label>
                        </TableCell>
                        {matchStatus === "completed" && (
                          <>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`player_stats.${index}.goals`}
                                render={({ field: f }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      disabled={!isPlayed}
                                      className="w-16 text-center"
                                      {...f}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`player_stats.${index}.assists`}
                                render={({ field: f }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      disabled={!isPlayed}
                                      className="w-16 text-center"
                                      {...f}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`player_stats.${index}.yellow_cards`}
                                render={({ field: f }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={2}
                                      disabled={!isPlayed}
                                      className="w-16 text-center"
                                      {...f}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`player_stats.${index}.red_cards`}
                                render={({ field: f }) => (
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={1}
                                      disabled={!isPlayed}
                                      className="w-16 text-center"
                                      {...f}
                                    />
                                  </FormControl>
                                )}
                              />
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Vista mobile — cards por jugador */}
            <div className="sm:hidden space-y-3">
              {fields.map((field, index) => {
                const isPlayed = form.watch(`player_stats.${index}.played`);
                return (
                  <div
                    key={field.id}
                    className={`rounded-lg border p-3 transition-opacity ${
                      isPlayed ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-base">
                        {field.nickname}
                      </Label>
                      <FormField
                        control={form.control}
                        name={`player_stats.${index}.played`}
                        render={({ field: checkField }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={checkField.value}
                                onCheckedChange={checkField.onChange}
                              />
                            </FormControl>
                            <Label className="text-sm text-muted-foreground font-normal cursor-pointer">
                              {matchStatus === "scheduled" ? "Va" : "Jugó"}
                            </Label>
                          </FormItem>
                        )}
                      />
                    </div>
                    {matchStatus === "completed" && <div className="grid grid-cols-4 gap-2 mt-3">
                      <FormField
                        control={form.control}
                        name={`player_stats.${index}.goals`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">⚽ Goles</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                disabled={!isPlayed}
                                className="text-center text-sm h-9"
                                {...f}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`player_stats.${index}.assists`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">🎯 Asist.</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                disabled={!isPlayed}
                                className="text-center text-sm h-9"
                                {...f}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`player_stats.${index}.yellow_cards`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">🟨 Amar.</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={2}
                                disabled={!isPlayed}
                                className="text-center text-sm h-9"
                                {...f}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`player_stats.${index}.red_cards`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">🟥 Roja</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={1}
                                disabled={!isPlayed}
                                className="text-center text-sm h-9"
                                {...f}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? "Guardar Cambios" : "Crear Partido"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
