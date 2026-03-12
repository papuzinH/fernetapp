-- ============================================
-- FernetApp Phase 3 — Fix scheduled matches & MVP tie handling
-- 1. Filter views to only count completed matches
-- 2. Fix MVP count to exclude ties (no MVP when multiple players share top votes)
-- ============================================

-- =====================
-- 1. Update v_player_career_stats: only count completed matches + fix MVP ties
-- =====================
CREATE OR REPLACE VIEW v_player_career_stats AS
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.position,
  p.is_active,
  COUNT(CASE WHEN mps.played THEN 1 END) AS matches_played,
  COALESCE(SUM(mps.goals), 0) AS total_goals,
  COALESCE(SUM(mps.assists), 0) AS total_assists,
  COALESCE(SUM(mps.goals), 0) + COALESCE(SUM(mps.assists), 0) AS goal_contributions,
  CASE
    WHEN COUNT(CASE WHEN mps.played THEN 1 END) > 0
    THEN ROUND(COALESCE(SUM(mps.goals), 0)::NUMERIC / COUNT(CASE WHEN mps.played THEN 1 END), 2)
    ELSE 0
  END AS goals_per_match,
  COALESCE(SUM(mps.yellow_cards), 0) AS total_yellow_cards,
  COALESCE(SUM(mps.red_cards), 0) AS total_red_cards,
  COALESCE(mvp.mvp_count, 0) AS mvp_count
FROM players p
LEFT JOIN match_player_stats mps ON p.id = mps.player_id
-- Only count stats from completed matches
LEFT JOIN matches m ON mps.match_id = m.id AND m.status = 'completed'
LEFT JOIN (
  -- Count MVPs: only when there is a single winner (no tie)
  SELECT player_id, COUNT(*) AS mvp_count
  FROM (
    -- Get the top vote getter for each match
    SELECT match_id, player_id, vote_count
    FROM (
      SELECT 
        match_id, 
        player_id, 
        COUNT(*) AS vote_count,
        RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC) AS rnk
      FROM mvp_votes
      GROUP BY match_id, player_id
    ) ranked_votes
    WHERE rnk = 1
  ) top_votes
  WHERE match_id IN (
    -- Only include matches where there's exactly one player with top votes (no tie)
    SELECT match_id
    FROM (
      SELECT 
        match_id, 
        player_id,
        COUNT(*) AS vote_count,
        RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC) AS rnk
      FROM mvp_votes
      GROUP BY match_id, player_id
    ) ranked_votes
    WHERE rnk = 1
    GROUP BY match_id
    HAVING COUNT(*) = 1
  )
  GROUP BY player_id
) mvp ON p.id = mvp.player_id
WHERE mps.match_id IS NULL OR m.id IS NOT NULL
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active, mvp.mvp_count;


-- =====================
-- 2. Update v_player_tournament_stats: only count completed matches
-- =====================
CREATE OR REPLACE VIEW v_player_tournament_stats AS
SELECT
  p.id AS player_id,
  p.nickname,
  t.id AS tournament_id,
  t.name AS tournament_name,
  t.year AS tournament_year,
  COUNT(CASE WHEN mps.played THEN 1 END) AS matches_played,
  COALESCE(SUM(mps.goals), 0) AS total_goals,
  COALESCE(SUM(mps.assists), 0) AS total_assists,
  COALESCE(SUM(mps.yellow_cards), 0) AS total_yellow_cards,
  COALESCE(SUM(mps.red_cards), 0) AS total_red_cards
FROM players p
JOIN match_player_stats mps ON p.id = mps.player_id
JOIN matches m ON mps.match_id = m.id
JOIN tournaments t ON m.tournament_id = t.id
WHERE m.status = 'completed'
GROUP BY p.id, p.nickname, t.id, t.name, t.year;


-- =====================
-- 3. Update v_team_summary: only count completed matches
-- =====================
CREATE OR REPLACE VIEW v_team_summary AS
SELECT
  COUNT(*) AS total_matches,
  COUNT(CASE WHEN result = 'V' THEN 1 END) AS wins,
  COUNT(CASE WHEN result = 'E' THEN 1 END) AS draws,
  COUNT(CASE WHEN result = 'D' THEN 1 END) AS losses,
  ROUND(
    COUNT(CASE WHEN result = 'V' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  COALESCE(SUM(goals_for), 0) AS total_goals_for,
  COALESCE(SUM(goals_against), 0) AS total_goals_against,
  COALESCE(SUM(goals_for) - SUM(goals_against), 0) AS goal_difference,
  COALESCE(SUM(yellow_cards), 0) AS total_yellow_cards,
  COALESCE(SUM(red_cards), 0) AS total_red_cards
FROM matches
WHERE status = 'completed';


-- =====================
-- 4. Update v_team_tournament_summary: only count completed matches
-- =====================
CREATE OR REPLACE VIEW v_team_tournament_summary AS
SELECT
  t.id AS tournament_id,
  t.name AS tournament_name,
  t.year AS tournament_year,
  COUNT(*) AS total_matches,
  COUNT(CASE WHEN m.result = 'V' THEN 1 END) AS wins,
  COUNT(CASE WHEN m.result = 'E' THEN 1 END) AS draws,
  COUNT(CASE WHEN m.result = 'D' THEN 1 END) AS losses,
  ROUND(
    COUNT(CASE WHEN m.result = 'V' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  SUM(m.goals_for) AS total_goals_for,
  SUM(m.goals_against) AS total_goals_against,
  SUM(m.goals_for) - SUM(m.goals_against) AS goal_difference
FROM matches m
JOIN tournaments t ON m.tournament_id = t.id
WHERE m.status = 'completed'
GROUP BY t.id, t.name, t.year
ORDER BY t.year DESC, t.name;
