"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Tournament } from "@/lib/supabase/types";

interface FixtureFiltersProps {
  tournaments: Tournament[];
  years: number[];
  currentTournament?: string;
  currentYear?: string;
}

export function FixtureFilters({
  tournaments,
  years,
  currentTournament,
  currentYear,
}: FixtureFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/fixtures?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/dashboard/fixtures");
  }

  const hasFilters = currentTournament || currentYear;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentTournament ?? "all"}
        onValueChange={(v) => updateFilter("tournament", v)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Todos los torneos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los torneos</SelectItem>
          {tournaments.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name} {t.year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentYear ?? "all"}
        onValueChange={(v) => updateFilter("year", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Todos los años" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los años</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  );
}
