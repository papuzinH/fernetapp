"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tournament } from "@/lib/supabase/types";

/**
 * Selector de alcance de las stats. "Histórico" no es un torneo más: es la
 * ausencia del filtro, y por eso limpia el parámetro en vez de setearlo.
 */
export function TournamentFilter({
  tournaments,
  current,
}: {
  tournaments: Tournament[];
  current?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("torneo");
    } else {
      params.set("torneo", value);
    }
    const qs = params.toString();
    router.push(qs ? `/stats?${qs}` : "/stats");
  }

  // Los torneos vienen ordenados por año descendente; se agrupan para que el
  // desplegable no sea una lista plana de 20 entradas indistinguibles.
  const byYear = tournaments.reduce<Record<number, Tournament[]>>((acc, t) => {
    (acc[t.year] ??= []).push(t);
    return acc;
  }, {});
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Select value={current ?? "all"} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[260px]" aria-label="Filtrar por torneo">
        <SelectValue placeholder="Histórico" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Histórico (todos los torneos)</SelectItem>
        {years.map((year) => (
          <SelectGroup key={year}>
            <SelectLabel>{year}</SelectLabel>
            {byYear[year].map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
