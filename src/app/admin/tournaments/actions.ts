"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  tournamentSchema,
  type TournamentFormValues,
} from "@/lib/schemas/tournament";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../matches/actions";

export async function createTournament(
  data: TournamentFormValues
): Promise<ActionResult> {
  const parsed = tournamentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tournaments").insert({
    name: parsed.data.name,
    year: parsed.data.year,
    description: parsed.data.description || null,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: `Ya existe el torneo "${parsed.data.name}" para el año ${parsed.data.year}`,
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/tournaments");
  revalidatePath("/admin/matches/new");
  return { success: true, message: "Torneo creado correctamente" };
}

export async function deleteTournament(
  tournamentId: string
): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();

  // Check if tournament has matches
  const { count } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (count && count > 0) {
    return {
      success: false,
      message: `No se puede eliminar: tiene ${count} partido(s) asociado(s)`,
    };
  }

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/tournaments");
  return { success: true, message: "Torneo eliminado" };
}
