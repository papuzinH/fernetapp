"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Nombre de la métrica, para los aria-label de los botones. Ej: "goles" */
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Entrada numérica con botones de −/+ y el valor tipeable.
 *
 * Nace de la carga de partidos: tocar un botón es más rápido que abrir el
 * teclado numérico para escribir "1", que es el 90% de los casos. El valor
 * sigue siendo un input porque cargar 3 goles a mano tiene que costar un
 * gesto, no tres toques.
 */
export function StepperInput({
  value,
  onChange,
  label,
  min = 0,
  max,
  disabled,
  className,
}: StepperInputProps) {
  const clamp = React.useCallback(
    (n: number) => {
      if (Number.isNaN(n)) return min;
      if (n < min) return min;
      if (max !== undefined && n > max) return max;
      return n;
    },
    [min, max]
  );

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div className={cn("flex items-stretch gap-1", className)}>
      <button
        type="button"
        aria-label={`Restar ${label}`}
        disabled={disabled || atMin}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input",
          "transition-colors hover:bg-muted active:bg-muted/80",
          "disabled:pointer-events-none disabled:opacity-40",
          "dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
        )}
      >
        <Minus className="h-4 w-4" />
      </button>

      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
        onFocus={(e) => e.target.select()}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-1 text-center text-base font-semibold tabular-nums",
          "outline-none transition-all duration-200",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "disabled:pointer-events-none disabled:opacity-50",
          "dark:bg-white/[0.04] dark:border-white/[0.08]",
          // Sacar las flechitas nativas: los botones ya cumplen esa función
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        )}
      />

      <button
        type="button"
        aria-label={`Sumar ${label}`}
        disabled={disabled || atMax}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input",
          "transition-colors hover:bg-muted active:bg-muted/80",
          "disabled:pointer-events-none disabled:opacity-40",
          "dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
