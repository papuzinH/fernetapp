# Rehacer la carga de partidos del admin

**Fecha**: 2026-08-06
**Estado**: diseño aprobado, sin implementar

## Problema

Cargar un partido es engorroso, y el cuello de botella es elegir quiénes jugaron.

El form lista el plantel completo ordenado alfabéticamente (`players.order("nickname")`), con un checkbox por jugador y cuatro casillas numéricas al lado. En un partido típico de 9 jugadores sobre un plantel de ~20, eso son 11 filas en `opacity-40` con 44 casillas deshabilitadas en pantalla. El orden alfabético no ayuda: no tiene relación con quién es probable que haya jugado.

Además, el marcador del equipo se tipea aparte de los goles individuales, así que pueden discrepar; hoy solo hay un badge que avisa de la diferencia.

## Decisiones

| Decisión | Por qué |
|---|---|
| Ordenar por **apariciones recientes**, desempatando por total histórico | El total histórico solo pondría arriba a quien jugó mucho alguna vez, aunque haya dejado de ir. Lo que se busca es "quién probablemente jugó este partido". |
| Marcar con **chips tocables**, no checkboxes | Target de 44px y un solo gesto, igual en celular y en escritorio. La carga pasa por los dos. |
| **Roster primero, stats después** | Las stats se arman solo con los seleccionados: se cargan 9 filas en vez de 20. |
| **Dar de baja el importador de WhatsApp** | Depende demasiado de cómo se armó la lista en el grupo. Se elimina `whatsapp-parser.tsx` y la dependencia `fuse.js`, su único consumidor. |
| El marcador **se autocompleta pero se puede pisar** | La suma estricta no contempla el gol en contra del rival ni el gol sin autor recordado. |
| **Recalcular pagos** al editar el roster | Hoy el split de la cancha queda con la lista vieja y nada avisa. |

### Fuera de alcance

- Tests automatizados: el repo no tiene suite y este trabajo no la introduce.
- Backfill del histórico (2017–2022, 2025) y cualquier cambio a las pantallas públicas.
- Rediseño de la sección A del form (fecha, torneo, rival): se mueve de archivo, no cambia.

## Diseño

### Datos: migración 006

Una view nueva, `v_player_selection_order`:

| Columna | Origen |
|---|---|
| `player_id`, `nickname`, `is_active` | `players` |
| `recent_appearances` | partidos con `played` dentro de los **10 partidos `completed` más recientes** del club (por `date DESC`) |
| `total_appearances` | partidos con `played` en toda la historia |

Orden de consumo: `recent_appearances DESC, total_appearances DESC, nickname ASC`.

El tercer criterio no es decorativo: sin él, los jugadores con `0, 0` (los recién dados de alta) salen en orden indeterminado y cambian de posición entre una carga y la siguiente, que es justo la estabilidad que el rediseño busca.

El `LEFT JOIN` sobre `players` **es correcto acá**, al revés que en `v_player_career_stats` (donde arrastra al plantel histórico a las pantallas públicas). Un jugador nuevo tiene 0 apariciones y tiene que poder seleccionarse: va último, no afuera.

`new/page.tsx` y `[id]/edit/page.tsx` pasan a leer de esta view con `.eq("is_active", true)`, reemplazando la consulta a `players`.

### Interfaz

**Zona 1 — Jugaron.** Grid de chips con el nickname. Tocar uno lo mueve entre "JUGARON (n)" y "RESTO DEL PLANTEL". El contador en el encabezado es la única cifra que hay que mirar para saber si está completo.

**Zona 2 — Stats.** Una fila por jugador seleccionado: nombre y cuatro steppers (goles, asistencias, amarillas, rojas). El valor es tocable para tipear directo cuando hay que cargar un número alto. Las cuatro stats siempre presentes.

**Orden dentro de cada zona**: el de la view, no el de selección. Un orden por "último tocado" reordena las filas cada vez que se corrige un error de marcado, y eso mueve de lugar la fila que se estaba por completar. *(Cambio respecto de lo conversado, donde se había dicho "en el orden en que los fuiste tocando".)*

**Marcador.** `goals_for` se llena con la suma de goles individuales mientras no se lo edite a mano. Al editarlo, se desacopla y queda mostrado el aviso de diferencia que ya existe. Volver a acoplarlo: vaciar el campo.

**Partido `scheduled`.** Los chips dicen "Va", no hay zona de stats ni marcador. Igual que hoy.

### Componentes

| Archivo | Responsabilidad | Interfaz |
|---|---|---|
| `forms/match-form.tsx` | Orquesta el form, el submit y el marcador derivado | props actuales (`tournaments`, `players`, `existingMatch`, `existingStats`) |
| `forms/match-details-fields.tsx` | Sección A: fecha, torneo, rival, resultado, tarjetas, notas | recibe el `form` |
| `forms/roster-picker.tsx` | Las dos zonas de chips | `players`, `selectedIds`, `onToggle` |
| `forms/player-stats-rows.tsx` | Filas de stats de los seleccionados | `players` seleccionados, `form` |
| `ui/stepper-input.tsx` | `−` valor `+`, valor tipeable | `value`, `onChange`, `min`, `max` |

`roster-picker` y `stepper-input` no conocen react-hook-form: reciben valor y `onChange`. Se pueden leer y modificar sin abrir el form.

El server no se toca para el guardado: `createMatch` y `updateMatch` ya filtran `.filter(ps => ps.played)`, así que mandar solo los seleccionados es compatible con el contrato actual.

### Pagos

`updateMatch` hoy borra todos los pagos del partido y los reinserta en la transición `scheduled → completed`. Aplicar eso a cualquier edición devolvería a pendiente un pago ya saldado. La reconciliación reemplaza al borrado:

| Caso | Qué pasa |
|---|---|
| Sigue en el roster | Conserva su `status`, se actualiza el `amount` |
| Entró al roster | Pago nuevo en `pending` |
| Salió del roster, `pending` | Se borra su pago |
| Salió del roster, `paid` | **No se decide solo**: entra en el diálogo de confirmación |

### El diálogo de confirmación

Las dos advertencias (stats que se descartan, pagos saldados que se tocan) no son avisos inline: son **un solo diálogo al apretar Guardar**, y aparece únicamente si hay algo que advertir. Lista los efectos concretos y ofrece continuar o volver al form.

```
Al guardar se van a perder estos datos:

  · Mago sale del partido y tenía 2 goles cargados
  · Lolo sale del partido y su pago de $2.800 estaba saldado

              [ Volver ]  [ Guardar igual ]
```

Sin advertencias, Guardar guarda: no se agrega un paso de confirmación a la carga normal.

### Errores y bordes

- **Sacar a un jugador con stats cargadas**: el server las descarta al filtrar por `played`; entra en el diálogo de arriba.
- **Guardar sin ningún jugador**: permitido — es el partido que se cargó sin detalle. No se generan pagos.
- **Editar un partido viejo**: los que jugaron llegan marcados; el orden por apariciones recientes no interfiere porque ya están en la zona de arriba.
- **Jugador dado de baja que jugó un partido viejo**: la view lo trae con `is_active = false` y la página lo filtra, así que **no aparecería en la edición de ese partido**. Para que sus stats no se pierdan al editar, la consulta de `edit` debe traer también a los jugadores con stats existentes en ese partido, aunque estén inactivos.

## Verificación

```
npm run lint && npx tsc --noEmit && npm run build
```

Más una prueba manual en el navegador, con un partido real de punta a punta: cargar, guardar, reabrir en edición y confirmar que quedó lo mismo. Incluye una edición que saque a un jugador con pago saldado, para ver el aviso.
