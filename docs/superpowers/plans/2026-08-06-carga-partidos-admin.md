# Carga de partidos del admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer la carga de partidos del admin: roster con chips ordenados por apariciones recientes, stats solo de los seleccionados, marcador derivado y pagos reconciliados.

**Architecture:** Una view nueva (`v_player_selection_order`) da el orden. `match-form.tsx` se parte en cuatro componentes con una responsabilidad cada uno; el estado del roster vive en el form y se pasa por props, así que los componentes de presentación no conocen react-hook-form. El contrato con el server no cambia para el guardado de stats — `createMatch`/`updateMatch` ya filtran por `played`.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript, Supabase, react-hook-form + Zod, shadcn/ui, Tailwind 4.

## Global Constraints

- Spec de referencia: `docs/superpowers/specs/2026-08-06-carga-partidos-admin-design.md`.
- Sin tests automatizados: el repo no tiene suite. La verificación de cada tarea es `npm run lint && npx tsc --noEmit` y, al cierre, `npm run build` más prueba en navegador.
- La verificación completa tiene que quedar en verde (los tres con exit 0).
- Conventional Commits, en español, sin acentos en el asunto del commit.
- Ventana de "reciente": los **10 partidos `completed` más recientes** del club por `date DESC`.
- Branch de trabajo: `feat/carga-partidos-admin`, base `main`.

---

### Task 1: Migración 006 — view del orden de selección

**Files:**
- Create: `supabase/migrations/006_player_selection_order.sql`

**Interfaces:**
- Produces: view `v_player_selection_order` con columnas `player_id` (uuid), `nickname` (text), `full_name` (text|null), `position` (text|null), `avatar_url` (text|null), `is_active` (bool), `recent_appearances` (bigint), `total_appearances` (bigint).

- [ ] **Step 1: Escribir la migración**

```sql
-- ============================================
-- FernetApp — Orden de seleccion de jugadores
-- v_player_selection_order: ordena el plantel por que tan probable es que
-- haya jugado el partido que se esta cargando.
--
-- El form del admin listaba a todos alfabeticamente, que no tiene relacion
-- con quien juega. Ordenar por total historico tampoco alcanza: deja arriba
-- al que jugo mucho hace dos anios y abajo al pibe nuevo que va todos los
-- sabados. Por eso el criterio primario son las apariciones recientes.
--
-- El LEFT JOIN es intencional (al reves que en v_player_career_stats, donde
-- arrastra al plantel historico a las pantallas publicas): un jugador recien
-- dado de alta tiene 0 apariciones y tiene que poder seleccionarse igual.
-- Va ultimo, no afuera.
-- ============================================

CREATE OR REPLACE VIEW v_player_selection_order AS
WITH recent_matches AS (
  SELECT id
  FROM matches
  WHERE status = 'completed'
  ORDER BY date DESC
  LIMIT 10
)
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.position,
  p.avatar_url,
  p.is_active,
  COUNT(*) FILTER (
    WHERE mps.played AND mps.match_id IN (SELECT id FROM recent_matches)
  ) AS recent_appearances,
  COUNT(*) FILTER (WHERE mps.played) AS total_appearances
FROM players p
LEFT JOIN match_player_stats mps ON p.id = mps.player_id
GROUP BY p.id, p.nickname, p.full_name, p.position, p.avatar_url, p.is_active;
```

- [ ] **Step 2: Aplicarla contra Supabase**

Via MCP de Supabase (`apply_migration`, project `wgekcqdlkcqvhhsaxrws`) o `npx supabase db push --linked`.

- [ ] **Step 3: Verificar que devuelve datos ordenados**

Query de control: `SELECT nickname, recent_appearances, total_appearances FROM v_player_selection_order WHERE is_active ORDER BY recent_appearances DESC, total_appearances DESC, nickname LIMIT 10;`
Esperado: filas con los habituales arriba y `recent_appearances` decreciente.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/006_player_selection_order.sql
git commit -m "feat(db): view v_player_selection_order para ordenar el plantel"
```

---

### Task 2: `StepperInput`

**Files:**
- Create: `src/components/ui/stepper-input.tsx`

**Interfaces:**
- Produces: `StepperInput({ value, onChange, min = 0, max, disabled, label, id })` — `value: number`, `onChange: (n: number) => void`. Renderiza `[−][valor][+]`; el valor es un `<input type="number">` para poder tipear. Clampea a `[min, max]` y nunca emite `NaN` (input vacío → `min`).

- [ ] **Step 1: Escribir el componente**

Botones de 40px con `type="button"` (obligatorio: dentro de un `<form>`, sin eso submitea). `aria-label` en cada botón: `Restar ${label}` / `Sumar ${label}`. El `−` se deshabilita en `min`, el `+` en `max`.

- [ ] **Step 2: Verificar**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/stepper-input.tsx
git commit -m "feat(ui): StepperInput para cargar numeros sin teclado"
```

---

### Task 3: `RosterPicker`

**Files:**
- Create: `src/components/forms/roster-picker.tsx`

**Interfaces:**
- Consumes: nada de tareas previas.
- Produces: `RosterPicker({ players, selectedIds, onToggle, playedLabel })` donde `players: SelectablePlayer[]` (`{ player_id, nickname }`), `selectedIds: string[]`, `onToggle: (id: string) => void`, `playedLabel: "Jugaron" | "Van"`. Exporta el tipo `SelectablePlayer`.

- [ ] **Step 1: Escribir el componente**

Dos bloques: `{playedLabel} (n)` con los seleccionados y `RESTO DEL PLANTEL` con el resto. Cada jugador es un `<button type="button">` de `min-h-11` (44px). Seleccionado: `bg-primary text-primary-foreground`. Sin seleccionar: `variant outline`. **Ambas zonas respetan el orden de entrada del array `players`** (el de la view), no el orden de selección — así una corrección de marcado no reordena las filas de stats de abajo. Si no hay seleccionados, la zona de arriba muestra "Tocá un jugador para marcarlo".

- [ ] **Step 2: Verificar**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/roster-picker.tsx
git commit -m "feat(admin): RosterPicker con chips para marcar quien jugo"
```

---

### Task 4: `PlayerStatsRows`

**Files:**
- Create: `src/components/forms/player-stats-rows.tsx`

**Interfaces:**
- Consumes: `StepperInput` (Task 2).
- Produces: `PlayerStatsRows({ form, indexes })` donde `indexes: { index: number; nickname: string }[]` — los índices del `useFieldArray` de `player_stats` que están seleccionados, en orden de la view.

- [ ] **Step 1: Escribir el componente**

Una fila por índice recibido: nickname + cuatro `StepperInput` (`goals`, `assists`, `yellow_cards` max 2, `red_cards` max 1) cableados con `FormField`. Layout: `grid-cols-2 sm:grid-cols-4`, etiquetas `⚽ Goles`, `🎯 Asist.`, `🟨 Amar.`, `🟥 Roja`. Sin variante desktop/mobile separada: la misma grilla responde en los dos tamaños, porque ahora son pocas filas.

- [ ] **Step 2: Verificar**

`npx tsc --noEmit` → exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/player-stats-rows.tsx
git commit -m "feat(admin): filas de stats solo de los jugadores seleccionados"
```

---

### Task 5: `MatchDetailsFields`

**Files:**
- Create: `src/components/forms/match-details-fields.tsx`
- Modify: `src/components/forms/match-form.tsx` (extraer la sección A)

**Interfaces:**
- Produces: `MatchDetailsFields({ form, tournaments, matchStatus, derivedGoalsFor })`.

- [ ] **Step 1: Mover la sección A tal cual**

Fecha, torneo, rival, bloque de `scheduled` (datetime/lugar/dirección), marcador, tarjetas, video, precio de cancha y notas. Sin cambios de comportamiento en esta tarea salvo el marcador, que pasa a Task 6.

- [ ] **Step 2: Verificar**

`npm run lint && npx tsc --noEmit` → ambos exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/
git commit -m "refactor(admin): extraer los datos del partido a su componente"
```

---

### Task 6: Orquestar el form + marcador derivado + diálogo

**Files:**
- Modify: `src/components/forms/match-form.tsx`
- Create: `src/components/forms/save-warnings-dialog.tsx`

**Interfaces:**
- Consumes: `RosterPicker`, `PlayerStatsRows`, `MatchDetailsFields`.
- Produces: `SaveWarningsDialog({ open, warnings, onConfirm, onCancel })` con `warnings: string[]`.

- [ ] **Step 1: Estado del roster y marcador derivado**

`selectedIds` se deriva de `player_stats[].played` (no se duplica estado). `onToggle` hace `form.setValue(\`player_stats.${idx}.played\`, next)` y, al desmarcar, **no borra** los goles cargados — para poder avisar en el diálogo.

Marcador: estado `goalsForTouched` (bool). Mientras sea `false`, un efecto de sincronización escribe `goals_for` con la suma de goles individuales. Se pone en `true` cuando el usuario edita el campo a mano; vuelve a `false` si lo deja vacío. El aviso de mismatch existente solo se muestra con `goalsForTouched === true`.

- [ ] **Step 2: Diálogo de advertencias al guardar**

`onSubmit` calcula las advertencias antes de llamar a la action:
- por cada jugador con `played === false` y (`goals > 0 || assists > 0 || yellow_cards > 0 || red_cards > 0`): `"{nickname} sale del partido y tenía {n} goles cargados"` (o la stat que corresponda).
- por cada `player_id` con pago `paid` en `existingPayments` que ya no está en el roster: `"{nickname} sale del partido y su pago de ${monto} estaba saldado"`.

Si el array está vacío → guarda directo, sin diálogo.

- [ ] **Step 3: Verificar**

`npm run lint && npx tsc --noEmit` → ambos exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/
git commit -m "feat(admin): roster picker en el form, marcador derivado y aviso al guardar"
```

---

### Task 7: Las páginas leen de la view

**Files:**
- Modify: `src/app/admin/matches/new/page.tsx`
- Modify: `src/app/admin/matches/[id]/edit/page.tsx`

- [ ] **Step 1: `new` consulta la view**

Reemplazar `.from("players").select("*").eq("is_active", true).order("nickname")` por la view, con `.eq("is_active", true)` y `.order("recent_appearances", { ascending: false }).order("total_appearances", { ascending: false }).order("nickname")`.

- [ ] **Step 2: `edit` incluye a los inactivos que jugaron ese partido**

Bug preexistente: un jugador con `is_active = false` que jugó el partido no llega al form, y como `updateMatch` borra y reinserta las stats, **sus goles se pierden al guardar**. La consulta de `edit` trae la view sin filtrar por activo y filtra en memoria:

```ts
const playedIds = new Set(stats.map((s) => s.player_id));
const players = all.filter((p) => p.is_active || playedIds.has(p.player_id));
```

- [ ] **Step 3: Verificar**

`npm run lint && npx tsc --noEmit` → ambos exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/matches/
git commit -m "fix(admin): ordenar por apariciones y no perder stats de inactivos al editar"
```

---

### Task 8: Reconciliar pagos en vez de borrarlos

**Files:**
- Modify: `src/app/admin/matches/actions.ts` (`updateMatch`)

- [ ] **Step 1: Reemplazar el delete+insert de payments**

Hoy solo corre en la transición `scheduled → completed` y hace `delete` de todo. Pasa a correr **en toda edición de un partido `completed` con `pitch_price`**, reconciliando:

```ts
// sigue en el roster -> conserva status, se actualiza el monto
// entro          -> insert pending
// salio, pending -> delete
// salio, paid    -> delete (ya fue confirmado en el dialogo del form)
```

- [ ] **Step 2: Verificar**

`npm run lint && npx tsc --noEmit` → ambos exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/matches/actions.ts
git commit -m "fix(admin): reconciliar pagos al editar el roster sin pisar los saldados"
```

---

### Task 9: Baja del importador de WhatsApp

**Files:**
- Delete: `src/components/whatsapp-parser.tsx`
- Modify: `package.json` (sacar `fuse.js`)

- [ ] **Step 1: Borrar el componente y la dependencia**

Verificar antes que no queden consumidores: `grep -rn "WhatsAppParser\|fuse" src/`.

- [ ] **Step 2: `npm install` para actualizar el lock**

- [ ] **Step 3: Verificar**

`npm run lint && npx tsc --noEmit && npm run build` → los tres exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: dar de baja el importador de WhatsApp y fuse.js"
```

---

### Task 10: Verificación end-to-end y merge

- [ ] **Step 1: Verificación completa**

`npm run lint && npx tsc --noEmit && npm run build` — los tres con exit 0.

- [ ] **Step 2: Prueba en navegador**

Levantar `npm run dev` y recorrer: `/admin/matches/new` (orden de los chips, marcar 9, cargar goles, ver el marcador autocompletarse, guardar) y la edición del partido creado (que vuelva igual).

- [ ] **Step 3: Merge a main y push**

```bash
git checkout main && git merge --no-ff feat/carga-partidos-admin && git push
```

---

## Self-review

**Cobertura del spec**: orden por apariciones → Task 1 + 7. Chips → Task 3. Stats de los seleccionados → Task 4. Steppers → Task 2. Marcador derivado → Task 6. Diálogo → Task 6. Pagos → Task 8. Baja de WhatsApp → Task 9. Borde del inactivo con stats → Task 7. Partido `scheduled` → Task 3 (`playedLabel`) + Task 5.

**Tipos**: `SelectablePlayer` se define en Task 3 y lo consumen Task 6 y 7. `StepperInput` se define en Task 2 y lo consume Task 4. `SaveWarningsDialog` se define y consume en Task 6.
