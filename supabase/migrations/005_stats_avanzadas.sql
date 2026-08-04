-- ============================================
-- FernetApp Phase 5 — Stats avanzadas
-- 1. v_match_mvp: el MVP de cada partido, en una sola view reutilizable
-- 2. v_player_tournament_stats: extendida para alimentar la tabla comparativa
-- 3. v_player_impact: cómo le va al equipo cuando cada jugador está en cancha
-- 4. v_opponent_record: historial contra cada rival
-- 5. v_team_season_evolution: la evolución del equipo año a año
-- 6. v_team_streaks: racha actual, mejor racha de victorias y mejor invicto
--
-- Todo lo de acá es aditivo salvo v_player_tournament_stats, que suma columnas
-- (por eso va con DROP: CREATE OR REPLACE no admite cambiar la lista de columnas).
-- Ninguna view existente cambia de forma, así que el dashboard actual no se toca.
-- ============================================


-- =====================
-- 1. MVP por partido
-- =====================
-- La lógica de "quién fue el MVP" estaba escrita a mano y anidada tres niveles
-- dentro de v_player_career_stats, y hacía falta de nuevo para contar MVPs por
-- torneo. Acá queda una sola vez. Regla (la misma de la 003): si hay empate en
-- votos, el partido no tiene MVP.
CREATE OR REPLACE VIEW v_match_mvp AS
WITH ranked_votes AS (
  SELECT
    match_id,
    player_id,
    COUNT(*) AS vote_count,
    RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC) AS rnk
  FROM mvp_votes
  GROUP BY match_id, player_id
),
top_votes AS (
  SELECT match_id, player_id, vote_count
  FROM ranked_votes
  WHERE rnk = 1
)
SELECT match_id, player_id, vote_count
FROM top_votes
WHERE match_id IN (
  -- Solo partidos con un único ganador
  SELECT match_id FROM top_votes GROUP BY match_id HAVING COUNT(*) = 1
);


-- =====================
-- 2. Stats por torneo, extendidas
-- =====================
-- La view original solo traía nickname y los totales crudos, así que la página
-- de stats no podía mostrar avatar, posición ni promedio sin cruzar a mano
-- contra players. Suma: full_name, position, is_active, avatar_url,
-- goal_contributions, goals_per_match y mvp_count.
DROP VIEW IF EXISTS v_player_tournament_stats;
CREATE VIEW v_player_tournament_stats AS
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.position,
  p.is_active,
  p.avatar_url,
  t.id AS tournament_id,
  t.name AS tournament_name,
  t.year AS tournament_year,
  COUNT(*) FILTER (WHERE mps.played) AS matches_played,
  COALESCE(SUM(mps.goals), 0) AS total_goals,
  COALESCE(SUM(mps.assists), 0) AS total_assists,
  COALESCE(SUM(mps.goals), 0) + COALESCE(SUM(mps.assists), 0) AS goal_contributions,
  CASE
    WHEN COUNT(*) FILTER (WHERE mps.played) > 0
    THEN ROUND(
      COALESCE(SUM(mps.goals), 0)::NUMERIC / COUNT(*) FILTER (WHERE mps.played), 2
    )
    ELSE 0
  END AS goals_per_match,
  COALESCE(SUM(mps.yellow_cards), 0) AS total_yellow_cards,
  COALESCE(SUM(mps.red_cards), 0) AS total_red_cards,
  COUNT(*) FILTER (WHERE mvp.player_id IS NOT NULL) AS mvp_count
FROM players p
JOIN match_player_stats mps ON p.id = mps.player_id
JOIN matches m ON mps.match_id = m.id
JOIN tournaments t ON m.tournament_id = t.id
LEFT JOIN v_match_mvp mvp ON mvp.match_id = m.id AND mvp.player_id = p.id
WHERE m.status = 'completed'
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active, p.avatar_url,
         t.id, t.name, t.year;


-- =====================
-- 3. Impacto del jugador
-- =====================
-- Responde "¿cómo le va al equipo cuando este tipo juega?". Es la stat que
-- separa al que mete goles en las goleadas del que aparece en los partidos
-- difíciles: un 9 puede tener el mejor promedio de gol y la peor efectividad.
-- points_percentage usa la escala de 3 puntos por victoria y 1 por empate,
-- que discrimina mejor que el % de victorias puro cuando hay muchos empates.
CREATE OR REPLACE VIEW v_player_impact AS
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.position,
  p.is_active,
  p.avatar_url,
  COUNT(*) AS matches_played,
  COUNT(*) FILTER (WHERE m.result = 'V') AS wins,
  COUNT(*) FILTER (WHERE m.result = 'E') AS draws,
  COUNT(*) FILTER (WHERE m.result = 'D') AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE m.result = 'V')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  ROUND(
    (COUNT(*) FILTER (WHERE m.result = 'V') * 3
     + COUNT(*) FILTER (WHERE m.result = 'E'))::NUMERIC
    / NULLIF(COUNT(*) * 3, 0) * 100, 2
  ) AS points_percentage,
  COALESCE(SUM(m.goals_for), 0) AS team_goals_for,
  COALESCE(SUM(m.goals_against), 0) AS team_goals_against,
  COALESCE(SUM(m.goals_for) - SUM(m.goals_against), 0) AS team_goal_difference,
  ROUND(AVG(m.goals_for), 2) AS avg_team_goals_for,
  ROUND(AVG(m.goals_against), 2) AS avg_team_goals_against
FROM players p
JOIN match_player_stats mps ON mps.player_id = p.id AND mps.played
JOIN matches m ON m.id = mps.match_id
WHERE m.status = 'completed'
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active, p.avatar_url;


-- =====================
-- 4. Historial por rival
-- =====================
-- OJO: matches.opponent es texto libre, así que "Scarlett FC" y "scarlett fc"
-- cuentan como dos rivales distintos. Se agrupa por el nombre con TRIM y
-- mayúsculas normalizadas para amortiguar los typos más comunes, y se expone
-- el nombre más usado como display. Si algún día se normalizan los rivales en
-- una tabla propia, esta view sale sobrando.
CREATE OR REPLACE VIEW v_opponent_record AS
WITH normalized AS (
  SELECT
    UPPER(TRIM(m.opponent)) AS opponent_key,
    TRIM(m.opponent) AS opponent_raw,
    m.result,
    m.goals_for,
    m.goals_against,
    m.date
  FROM matches m
  WHERE m.status = 'completed' AND TRIM(COALESCE(m.opponent, '')) <> ''
),
display_name AS (
  -- De todas las grafías de un mismo rival, gana la más usada
  SELECT opponent_key, opponent_raw
  FROM (
    SELECT
      opponent_key,
      opponent_raw,
      ROW_NUMBER() OVER (
        PARTITION BY opponent_key
        ORDER BY COUNT(*) DESC, opponent_raw
      ) AS rn
    FROM normalized
    GROUP BY opponent_key, opponent_raw
  ) ranked
  WHERE rn = 1
)
SELECT
  n.opponent_key,
  d.opponent_raw AS opponent,
  COUNT(*) AS total_matches,
  COUNT(*) FILTER (WHERE n.result = 'V') AS wins,
  COUNT(*) FILTER (WHERE n.result = 'E') AS draws,
  COUNT(*) FILTER (WHERE n.result = 'D') AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE n.result = 'V')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  COALESCE(SUM(n.goals_for), 0) AS total_goals_for,
  COALESCE(SUM(n.goals_against), 0) AS total_goals_against,
  COALESCE(SUM(n.goals_for) - SUM(n.goals_against), 0) AS goal_difference,
  MAX(n.date) AS last_played
FROM normalized n
JOIN display_name d ON d.opponent_key = n.opponent_key
GROUP BY n.opponent_key, d.opponent_raw;


-- =====================
-- 5. Evolución por temporada
-- =====================
-- Agrupa por año calendario de la fecha del partido, no por torneo: un torneo
-- puede cruzar dos años y para el gráfico de evolución lo que importa es la
-- línea de tiempo.
CREATE OR REPLACE VIEW v_team_season_evolution AS
SELECT
  EXTRACT(YEAR FROM m.date)::INT AS season_year,
  COUNT(*) AS total_matches,
  COUNT(*) FILTER (WHERE m.result = 'V') AS wins,
  COUNT(*) FILTER (WHERE m.result = 'E') AS draws,
  COUNT(*) FILTER (WHERE m.result = 'D') AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE m.result = 'V')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  COALESCE(SUM(m.goals_for), 0) AS total_goals_for,
  COALESCE(SUM(m.goals_against), 0) AS total_goals_against,
  COALESCE(SUM(m.goals_for) - SUM(m.goals_against), 0) AS goal_difference,
  ROUND(AVG(m.goals_for), 2) AS avg_goals_for,
  ROUND(AVG(m.goals_against), 2) AS avg_goals_against
FROM matches m
WHERE m.status = 'completed'
GROUP BY EXTRACT(YEAR FROM m.date)
ORDER BY season_year;


-- =====================
-- 6. Rachas del equipo
-- =====================
-- Gaps-and-islands clásico: se numeran los partidos por fecha y la diferencia
-- entre esa numeración y la numeración dentro de cada resultado es constante
-- mientras la racha no se corta.
--
-- El desempate va por created_at porque matches.date es DATE (sin hora) y puede
-- haber dos partidos el mismo día; sin desempate el orden sería no determinista
-- y la racha podría cambiar entre consultas.
--
-- Devuelve siempre exactamente una fila (todo NULL si no hay partidos cargados).
CREATE OR REPLACE VIEW v_team_streaks AS
WITH ordered AS (
  SELECT
    m.date,
    m.result,
    ROW_NUMBER() OVER (ORDER BY m.date, m.created_at) AS rn
  FROM matches m
  WHERE m.status = 'completed'
),
-- Islas de resultado idéntico consecutivo
result_islands AS (
  SELECT
    result,
    date,
    rn,
    rn - ROW_NUMBER() OVER (PARTITION BY result ORDER BY rn) AS island
  FROM ordered
),
result_streaks AS (
  SELECT
    result,
    COUNT(*) AS length,
    MIN(date) AS from_date,
    MAX(date) AS to_date,
    MAX(rn) AS ends_at
  FROM result_islands
  GROUP BY result, island
),
-- Islas de invicto (victoria o empate)
unbeaten_islands AS (
  SELECT
    date,
    rn,
    rn - ROW_NUMBER() OVER (ORDER BY rn) AS island
  FROM ordered
  WHERE result <> 'D'
),
unbeaten_streaks AS (
  SELECT
    COUNT(*) AS length,
    MIN(date) AS from_date,
    MAX(date) AS to_date
  FROM unbeaten_islands
  GROUP BY island
),
last_match AS (
  SELECT MAX(rn) AS rn FROM ordered
),
-- La racha en curso es la isla que termina en el último partido jugado
current_streak AS (
  SELECT rs.result, rs.length, rs.from_date
  FROM result_streaks rs
  JOIN last_match lm ON rs.ends_at = lm.rn
),
best_win AS (
  SELECT length, from_date, to_date
  FROM result_streaks
  WHERE result = 'V'
  ORDER BY length DESC, to_date DESC
  LIMIT 1
),
best_unbeaten AS (
  SELECT length, from_date, to_date
  FROM unbeaten_streaks
  ORDER BY length DESC, to_date DESC
  LIMIT 1
)
SELECT
  (SELECT result FROM current_streak) AS current_streak_result,
  (SELECT length FROM current_streak) AS current_streak_length,
  (SELECT from_date FROM current_streak) AS current_streak_since,
  (SELECT length FROM best_win) AS best_win_streak,
  (SELECT from_date FROM best_win) AS best_win_streak_from,
  (SELECT to_date FROM best_win) AS best_win_streak_to,
  (SELECT length FROM best_unbeaten) AS best_unbeaten_streak,
  (SELECT from_date FROM best_unbeaten) AS best_unbeaten_streak_from,
  (SELECT to_date FROM best_unbeaten) AS best_unbeaten_streak_to;
