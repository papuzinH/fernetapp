-- ============================================
-- FernetApp - Schema Inicial
-- Equipo: Fernet con Guaymallén
-- ============================================

-- Tabla de Jugadores
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT UNIQUE NOT NULL,
  full_name TEXT,
  position TEXT CHECK (position IN ('ARQ', 'DEF', 'MED', 'DEL')),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de Torneos
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INT NOT NULL CHECK (year >= 2017 AND year <= 2030),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (name, year)
);

-- Tabla de Partidos
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE RESTRICT,
  opponent TEXT NOT NULL,
  goals_for INT NOT NULL CHECK (goals_for >= 0),
  goals_against INT NOT NULL CHECK (goals_against >= 0),
  result TEXT GENERATED ALWAYS AS (
    CASE
      WHEN goals_for > goals_against THEN 'V'
      WHEN goals_for = goals_against THEN 'E'
      ELSE 'D'
    END
  ) STORED,
  yellow_cards INT DEFAULT 0 CHECK (yellow_cards >= 0),
  red_cards INT DEFAULT 0 CHECK (red_cards >= 0),
  video_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de Stats por Jugador por Partido
CREATE TABLE match_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  played BOOLEAN DEFAULT TRUE NOT NULL,
  goals INT DEFAULT 0 CHECK (goals >= 0),
  assists INT DEFAULT 0 CHECK (assists >= 0),
  yellow_cards INT DEFAULT 0 CHECK (yellow_cards >= 0),
  red_cards INT DEFAULT 0 CHECK (red_cards >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (match_id, player_id)
);

-- Índices para performance
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_date ON matches(date DESC);
CREATE INDEX idx_match_stats_match ON match_player_stats(match_id);
CREATE INDEX idx_match_stats_player ON match_player_stats(player_id);

-- ============================================
-- VIEWS para el Dashboard
-- ============================================

-- Stats de carrera de cada jugador (Salón de la Fama)
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
  COALESCE(SUM(mps.red_cards), 0) AS total_red_cards
FROM players p
LEFT JOIN match_player_stats mps ON p.id = mps.player_id
GROUP BY p.id, p.nickname, p.full_name, p.position, p.is_active;

-- Stats por torneo/año
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
GROUP BY p.id, p.nickname, t.id, t.name, t.year;

-- Resumen del equipo
CREATE OR REPLACE VIEW v_team_summary AS
SELECT
  COUNT(*) AS total_matches,
  COUNT(CASE WHEN result = 'V' THEN 1 END) AS wins,
  COUNT(CASE WHEN result = 'E' THEN 1 END) AS draws,
  COUNT(CASE WHEN result = 'D' THEN 1 END) AS losses,
  ROUND(
    COUNT(CASE WHEN result = 'V' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2
  ) AS win_percentage,
  SUM(goals_for) AS total_goals_for,
  SUM(goals_against) AS total_goals_against,
  SUM(goals_for) - SUM(goals_against) AS goal_difference,
  SUM(yellow_cards) AS total_yellow_cards,
  SUM(red_cards) AS total_red_cards
FROM matches;

-- Resumen del equipo filtrable por torneo
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
GROUP BY t.id, t.name, t.year
ORDER BY t.year DESC, t.name;

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
