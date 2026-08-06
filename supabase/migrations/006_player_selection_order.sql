-- ============================================
-- FernetApp — Orden de seleccion de jugadores
-- v_player_selection_order: ordena el plantel por que tan probable es que
-- haya jugado el partido que se esta cargando.
--
-- El form del admin listaba a todos alfabeticamente, que no tiene ninguna
-- relacion con quien juega. Ordenar por total historico tampoco alcanza:
-- deja arriba al que jugo mucho hace dos anios y abajo al pibe nuevo que
-- va todos los sabados. Por eso el criterio primario son las apariciones
-- en los ultimos 10 partidos, con el total historico como desempate.
--
-- El LEFT JOIN es intencional, al reves que en v_player_career_stats (donde
-- arrastra al plantel historico entero a las pantallas publicas): un jugador
-- recien dado de alta tiene 0 apariciones y tiene que poder seleccionarse
-- igual. Va ultimo, no afuera.
--
-- Aditivo: no toca ninguna view existente.
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
