/**
 * Script de Seed — Ingesta inicial de datos del spreadsheet "HISTORIAL FERNETERO"
 *
 * Uso:
 *   1. Configurá SUPABASE_URL y SUPABASE_SERVICE_KEY abajo (o en .env)
 *   2. Ejecutá: npx tsx scripts/seed.ts
 *
 * Este script:
 *   - Crea los jugadores históricos (~35)
 *   - Crea los torneos por año
 *   - Crea los partidos de todas las temporadas (2017-2025)
 *   - NO crea match_player_stats (el Excel no tiene esa granularidad)
 */

import { createClient } from "@supabase/supabase-js";

// ⚠️ Reemplazar con tus credenciales (o usar env vars)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://TU-PROYECTO.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "TU-SERVICE-ROLE-KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ========================
// DATOS DE JUGADORES (del HISTORIAL GLOBAL)
// ========================
const PLAYERS = [
  { nickname: "Pitu", position: null },
  { nickname: "Elías", position: null },
  { nickname: "Papu", position: null },
  { nickname: "Javi", position: null },
  { nickname: "Seba", position: null },
  { nickname: "Mateo", position: null },
  { nickname: "Lolo", position: null },
  { nickname: "Aro", position: null },
  { nickname: "Chocho", position: null },
  { nickname: "Rodri", position: null },
  { nickname: "Bauti", position: null },
  { nickname: "Thiago", position: null },
  { nickname: "Santi", position: null },
  { nickname: "Ian", position: null },
  { nickname: "Joaco", position: null },
  { nickname: "Lauti", position: null },
  { nickname: "Juan", position: null },
  { nickname: "Vladi", position: null },
  { nickname: "Carril", position: null },
  { nickname: "Gaspo", position: null },
  { nickname: "Yaman", position: null },
  { nickname: "Belsito", position: null },
  { nickname: "Reyero", position: null },
  { nickname: "Ruso", position: null },
  { nickname: "Bauti (Arq)", position: "ARQ" as const },
  { nickname: "Leo", position: null },
  { nickname: "Bauti DL", position: null },
  { nickname: "Juanma (Primo)", position: null },
  { nickname: "Gaspo Fran", position: null },
  { nickname: "Janello", position: null },
  { nickname: "Tincho", position: null },
  { nickname: "Seba K", position: null },
  { nickname: "deivo", position: null },
  { nickname: "Ivata", position: null },
  { nickname: "Agus ch", position: null },
  { nickname: "Enzo valen", position: null },
  { nickname: "Tomo thiago", position: null },
  { nickname: "Santi (Lolo)", position: null },
  { nickname: "Santi mate arq", position: "ARQ" as const },
];

// ========================
// DATOS DE PARTIDOS POR AÑO (del FIXTURE de cada pestaña)
// Formato: { date: "YYYY-MM-DD", tournament: "NOMBRE TORNEO", opponent, goals_for, goals_against, yellow, red, notes? }
// ========================

// FIXTURE 2025
const MATCHES_2025 = [
  { date: "2025-02-17", tournament: "TORNEO ANTERIOR", opponent: "Girarg", goals_for: 3, goals_against: 3, yellow: 3, red: 1 },
  { date: "2025-03-09", tournament: "LN 11 DIV", opponent: "Integrales", goals_for: 6, goals_against: 2, yellow: 4, red: 1 },
  { date: "2025-03-16", tournament: "LN 11 DIV", opponent: "Deportivo Chaja", goals_for: 4, goals_against: 2, yellow: 1, red: 1 },
  { date: "2025-03-23", tournament: "LN 11 DIV", opponent: "Salmón", goals_for: 3, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-04-06", tournament: "LN 11 DIV", opponent: "Exactas", goals_for: 2, goals_against: 0, yellow: 0, red: 0 },
  { date: "2025-04-13", tournament: "LN 11 DIV", opponent: "Los Mungikys", goals_for: 1, goals_against: 2, yellow: 0, red: 0 },
  { date: "2025-04-20", tournament: "LN 11 DIV", opponent: "DFC", goals_for: 3, goals_against: 2, yellow: 2, red: 0 },
  { date: "2025-04-27", tournament: "LN 11 DIV", opponent: "Guarriors", goals_for: 2, goals_against: 1, yellow: 3, red: 0 },
  { date: "2025-05-01", tournament: "LN 11 DIV", opponent: "Franja de Gaza", goals_for: 3, goals_against: 0, yellow: 5, red: 0 },
  { date: "2025-05-04", tournament: "LN 11 DIV", opponent: "Rosario Sensual", goals_for: 4, goals_against: 2, yellow: 1, red: 0 },
  { date: "2025-05-11", tournament: "LN 11 DIV", opponent: "Flecha Libre", goals_for: 6, goals_against: 3, yellow: 1, red: 1 },
  { date: "2025-05-19", tournament: "LN 10 DIV", opponent: "Igor FC", goals_for: 5, goals_against: 2, yellow: 5, red: 1 },
  { date: "2025-05-25", tournament: "LN 10 DIV", opponent: "Los Novelistas", goals_for: 2, goals_against: 1, yellow: 1, red: 0 },
  { date: "2025-06-01", tournament: "LN 10 DIV", opponent: "Rosario Sensual", goals_for: 4, goals_against: 0, yellow: 0, red: 0 },
  { date: "2025-06-15", tournament: "LN 10 DIV", opponent: "Cero Puntos", goals_for: 3, goals_against: 2, yellow: 0, red: 1 },
  { date: "2025-06-17", tournament: "LN 10 DIV", opponent: "El Cerrado", goals_for: 3, goals_against: 3, yellow: 1, red: 0 },
  { date: "2025-06-22", tournament: "LN 10 DIV", opponent: "Conozco tu debilidad", goals_for: 7, goals_against: 2, yellow: 1, red: 0 },
  { date: "2025-06-29", tournament: "LN 10 DIV", opponent: "Amargo obrero", goals_for: 5, goals_against: 2, yellow: 0, red: 0 },
  { date: "2025-07-06", tournament: "LN 10 DIV", opponent: "Viejos Vinagres", goals_for: 5, goals_against: 0, yellow: 2, red: 0 },
  { date: "2025-07-13", tournament: "LN 10 DIV", opponent: "Scarlett FC", goals_for: 6, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-07-20", tournament: "LN 10 DIV", opponent: "Nápalos FC", goals_for: 4, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-07-27", tournament: "LN 10 DIV", opponent: "Chidos FC", goals_for: 3, goals_against: 3, yellow: 5, red: 1 },
  { date: "2025-08-17", tournament: "LN 9 DIV", opponent: "Deportivo Luro", goals_for: 3, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-08-24", tournament: "LN 9 DIV", opponent: "Los Turkos", goals_for: 3, goals_against: 4, yellow: 1, red: 0 },
  { date: "2025-09-07", tournament: "LN 9 DIV", opponent: "El cerrado", goals_for: 1, goals_against: 1, yellow: 3, red: 0 },
  { date: "2025-09-14", tournament: "LN 9 DIV", opponent: "Bruto FC", goals_for: 3, goals_against: 0, yellow: 0, red: 0, notes: "no se presentaron" },
  { date: "2025-09-28", tournament: "LN 9 DIV", opponent: "Conozco tu debilidad", goals_for: 1, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-10-05", tournament: "LN 9 DIV", opponent: "Miticos", goals_for: 1, goals_against: 2, yellow: 0, red: 0 },
  { date: "2025-10-11", tournament: "LN 9 DIV", opponent: "Igor", goals_for: 2, goals_against: 0, yellow: 0, red: 0 },
  { date: "2025-10-12", tournament: "LN 9 DIV", opponent: "Moia FC", goals_for: 3, goals_against: 1, yellow: 0, red: 0 },
  { date: "2025-10-12", tournament: "LN 9 DIV", opponent: "Lujan FC", goals_for: 1, goals_against: 3, yellow: 0, red: 1 },
  { date: "2025-10-12", tournament: "LN 9 DIV", opponent: "Corte y sonrisa", goals_for: 2, goals_against: 3, yellow: 0, red: 0 },
  { date: "2025-10-12", tournament: "LN 9 DIV", opponent: "Garrafas fc", goals_for: 2, goals_against: 3, yellow: 0, red: 0 },
];

// Combinar todos los partidos
const ALL_MATCHES = [
  ...MATCHES_2025,
  // Futuras temporadas se agregan acá (MATCHES_2024, MATCHES_2023, etc.)
  // cuando se procesen las hojas correspondientes del spreadsheet
];

// ========================
// SEED LOGIC
// ========================
async function seed() {
  console.log("🍺 Iniciando seed de FernetApp...\n");

  // 1. Crear jugadores
  console.log("👥 Creando jugadores...");
  const { data: insertedPlayers, error: playersError } = await supabase
    .from("players")
    .upsert(
      PLAYERS.map((p) => ({
        nickname: p.nickname,
        position: p.position,
        is_active: true,
      })),
      { onConflict: "nickname" }
    )
    .select("id, nickname");

  if (playersError) {
    console.error("❌ Error creando jugadores:", playersError);
    return;
  }
  console.log(`✅ ${insertedPlayers?.length ?? 0} jugadores creados/actualizados`);

  // 2. Crear torneos (extraer nombres únicos de los partidos)
  console.log("\n🏆 Creando torneos...");
  const uniqueTournaments = [
    ...new Map(
      ALL_MATCHES.map((m) => {
        const year = parseInt(m.date.substring(0, 4));
        return [`${m.tournament}-${year}`, { name: m.tournament, year }];
      })
    ).values(),
  ];

  const { data: insertedTournaments, error: tournamentsError } = await supabase
    .from("tournaments")
    .upsert(
      uniqueTournaments.map((t) => ({
        name: t.name,
        year: t.year,
      })),
      { onConflict: "name,year" }
    )
    .select("id, name, year");

  if (tournamentsError) {
    console.error("❌ Error creando torneos:", tournamentsError);
    return;
  }
  console.log(`✅ ${insertedTournaments?.length ?? 0} torneos creados/actualizados`);

  // Build tournament lookup
  const tournamentMap = new Map(
    (insertedTournaments ?? []).map((t) => [`${t.name}-${t.year}`, t.id])
  );

  // 3. Crear partidos
  console.log("\n⚽ Creando partidos...");
  let matchCount = 0;

  for (const match of ALL_MATCHES) {
    const year = parseInt(match.date.substring(0, 4));
    const tournamentId = tournamentMap.get(`${match.tournament}-${year}`);

    if (!tournamentId) {
      console.warn(`⚠️ Torneo no encontrado: ${match.tournament} ${year}`);
      continue;
    }

    const { error } = await supabase.from("matches").insert({
      date: match.date,
      tournament_id: tournamentId,
      opponent: match.opponent,
      goals_for: match.goals_for,
      goals_against: match.goals_against,
      yellow_cards: match.yellow,
      red_cards: match.red,
      notes: (match as { notes?: string }).notes ?? null,
    });

    if (error) {
      console.warn(`⚠️ Error insertando partido vs ${match.opponent}: ${error.message}`);
    } else {
      matchCount++;
    }
  }

  console.log(`✅ ${matchCount} partidos creados`);

  // Resumen
  console.log("\n" + "=".repeat(50));
  console.log("🍺 SEED COMPLETADO");
  console.log(`   Jugadores: ${insertedPlayers?.length ?? 0}`);
  console.log(`   Torneos: ${insertedTournaments?.length ?? 0}`);
  console.log(`   Partidos: ${matchCount}`);
  console.log("=".repeat(50));
  console.log("\n📝 Nota: Las stats individuales por partido (match_player_stats)");
  console.log("   no se migraron porque el Excel no tiene esa granularidad.");
  console.log("   Podés cargarlas retroactivamente desde /admin/matches/[id]/edit");
}

seed().catch(console.error);
