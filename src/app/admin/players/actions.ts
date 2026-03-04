"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { playerSchema, type PlayerFormValues } from "@/lib/schemas/player";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../matches/actions";

export async function createPlayer(
  data: PlayerFormValues
): Promise<ActionResult> {
  const parsed = playerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("players").insert({
    nickname: parsed.data.nickname,
    full_name: parsed.data.full_name || null,
    position: parsed.data.position ?? null,
    is_active: parsed.data.is_active,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Ya existe un jugador con el apodo "${parsed.data.nickname}"`,
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/players");
  revalidatePath("/admin/matches/new");
  return { success: true, message: "Jugador creado correctamente" };
}

export async function updatePlayer(
  playerId: string,
  data: PlayerFormValues
): Promise<ActionResult> {
  const parsed = playerSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("players")
    .update({
      nickname: parsed.data.nickname,
      full_name: parsed.data.full_name || null,
      position: parsed.data.position ?? null,
      is_active: parsed.data.is_active,
    })
    .eq("id", playerId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/players");
  return { success: true, message: "Jugador actualizado correctamente" };
}

export async function togglePlayerActive(
  playerId: string,
  active: boolean
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("players")
    .update({ is_active: active })
    .eq("id", playerId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/players");
  return {
    success: true,
    message: active ? "Jugador activado" : "Jugador desactivado",
  };
}
