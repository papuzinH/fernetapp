-- ============================================
-- FernetApp Phase 2 — Migración incremental
-- Módulos: Próximo Partido, Fernet-Wise, MVP, Social
-- ============================================

-- =====================
-- 1. ALTER matches: nuevos campos
-- =====================
ALTER TABLE matches
  ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('scheduled', 'completed')),
  ADD COLUMN location_name TEXT,
  ADD COLUMN location_address TEXT,
  ADD COLUMN datetime TIMESTAMPTZ,
  ADD COLUMN pitch_price NUMERIC(10,2) CHECK (pitch_price >= 0),
  ADD COLUMN notified_24h BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para buscar próximo partido scheduled
CREATE INDEX idx_matches_status_datetime ON matches(status, datetime)
  WHERE status = 'scheduled';

-- =====================
-- 2. Tabla de Pagos (Fernet-Wise)
-- =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (player_id, match_id)
);

CREATE INDEX idx_payments_player ON payments(player_id);
CREATE INDEX idx_payments_match ON payments(match_id);
CREATE INDEX idx_payments_status ON payments(status) WHERE status = 'pending';

-- =====================
-- 3. Tabla de Votación MVP
-- =====================
CREATE TABLE mvp_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (match_id, device_id)
);

CREATE INDEX idx_mvp_votes_match ON mvp_votes(match_id);

-- =====================
-- 4. Tabla de Suscripciones Push
-- =====================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================
-- 5. Actualizar vista v_player_career_stats (agregar mvp_count)
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
LEFT JOIN (
  -- Subconsulta: contar cuántas veces cada jugador ganó el MVP de un partido
  SELECT player_id, COUNT(*) AS mvp_count
  FROM (
    SELECT DISTINCT ON (match_id) match_id, player_id
    FROM mvp_votes
    GROUP BY match_id, player_id
    ORDER BY match_id, COUNT(*) DESC
  ) winners
  GROUP BY player_id
) mvp ON p.id = mvp.player_id
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active, mvp.mvp_count;

-- =====================
-- 6. Vista de deudas por jugador
-- =====================
CREATE OR REPLACE VIEW v_player_debt_summary AS
SELECT
  p.id AS player_id,
  p.nickname,
  p.full_name,
  p.is_active,
  COALESCE(SUM(CASE WHEN pay.status = 'pending' THEN pay.amount ELSE 0 END), 0) AS total_debt,
  COALESCE(SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END), 0) AS total_paid,
  COUNT(CASE WHEN pay.status = 'pending' THEN 1 END) AS pending_matches,
  COUNT(pay.id) AS total_matches_with_payment
FROM players p
LEFT JOIN payments pay ON p.id = pay.player_id
GROUP BY p.id, p.nickname, p.full_name, p.is_active
ORDER BY total_debt DESC;
