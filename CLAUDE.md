# FernetApp — CLAUDE.md

> Fuente de verdad operativa del repo. El estado del proyecto vive en el vault Panchito (ver sección Panchito Kit).

## Qué es

PWA de gestión y estadísticas del **Club Atlético Fernet con Guaymallén**, el equipo de fútbol amateur de los sábados. Público: dashboard, partidos, jugadores, posiciones y `/stats`. Admin protegido (un solo usuario): CRUD de partidos, jugadores, torneos y pagos de cancha.

**Stack**: Next.js 16 (App Router, RSC) · React 19 · TypeScript · Supabase (PostgreSQL + Auth) · shadcn/ui + Tailwind 4 · PWA con Web Push (VAPID) · Instagram Graph API.

⚠️ **El club existe desde 2017 pero la base arranca en 2023** (58 partidos en 2023, 2024 y 2026 — 2025 vacío). No escribir "desde 2017" en la app: los datos no lo respaldan.

## Comandos

```
npm run dev       # desarrollo
npm run build     # build de producción
npm run lint      # ESLint
npx tsc --noEmit  # typecheck (no hay script propio)
```

No hay suite de tests: la verificación es `lint` + `build`.

## Trampas conocidas

- **`v_player_career_stats` sale de un LEFT JOIN**: trae el plantel histórico completo juegue o no (43 filas, 23 en cero). Filtrar por partidos jugados al consumirla.
- **Años sin partidos**: insertarlos como huecos explícitos en series temporales, o la línea une 2024 con 2026 como si fueran consecutivos.
- **Colores de gráficos**: CSS vars `--fcg-chart-*`, con steps de modo oscuro propios (no un flip de los claros). Recharts las escribe en el SVG y el navegador resuelve el tema — no leer el tema en JS.
- **`SUPABASE_DB_PASSWORD` del `.env.local` necesita comillas simples**, si no el parseo rompe.
- **El token de Instagram vence cada 60 días** y el widget desaparece en silencio (retorna null) cuando pasa.

## Reglas duras

1. **Nunca commitear secretos** (`.env*`, credenciales, keys). Ante la duda, no commitear.
2. **Verificación antes de merge a main**: correr los comandos de `verificacion` de la sección Panchito Kit.
3. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).

## Panchito Kit
- nivel: lite
- status: 40-PROYECTOS/FernetApp/FernetApp - Status & Roadmap.md
- fuente_producto: vault
- verificacion: npm run lint && npx tsc --noEmit && npm run build
- branch_base: main
