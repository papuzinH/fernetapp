-- ============================================
-- FernetApp Phase 4 — Player Avatars
-- 1. Add avatar_url column to players table
-- 2. Update v_player_career_stats view to expose avatar_url
-- 3. Create Supabase Storage bucket for player photos
-- ============================================

-- =====================
-- 1. Add avatar_url column
-- =====================
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =====================
-- 2. Update v_player_career_stats to include avatar_url
-- =====================
DROP VIEW IF EXISTS v_player_career_stats;
CREATE VIEW v_player_career_stats AS
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.position,
  p.is_active,
  p.avatar_url,
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
    SELECT match_id
    FROM (
      SELECT
        match_id,
        player_id,
        RANK() OVER (PARTITION BY match_id ORDER BY COUNT(*) DESC) AS rnk
      FROM mvp_votes
      GROUP BY match_id, player_id
    ) ranked
    WHERE rnk = 1
    GROUP BY match_id
    HAVING COUNT(*) = 1
  )
  GROUP BY player_id
) mvp ON p.id = mvp.player_id
WHERE mps.match_id IS NULL OR m.id IS NOT NULL
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active, p.avatar_url, mvp.mvp_count;

-- =====================
-- 3. Storage bucket for player avatars (2 MB, public)
-- =====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-avatars',
  'player-avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- 4. Storage policies
-- =====================
DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'player_avatars_public_read'
  ) THEN
    CREATE POLICY "player_avatars_public_read"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'player-avatars');
  END IF;

  -- Authenticated insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'player_avatars_auth_insert'
  ) THEN
    CREATE POLICY "player_avatars_auth_insert"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'player-avatars');
  END IF;

  -- Authenticated update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'player_avatars_auth_update'
  ) THEN
    CREATE POLICY "player_avatars_auth_update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'player-avatars');
  END IF;

  -- Authenticated delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'player_avatars_auth_delete'
  ) THEN
    CREATE POLICY "player_avatars_auth_delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'player-avatars');
  END IF;
END $$;
