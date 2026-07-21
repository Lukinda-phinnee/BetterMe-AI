-- =============================================================================
-- Habit Tracker Module — Schema
-- =============================================================================
-- Creates the three habit tables (habits, habit_completions, habit_streaks),
-- their indexes, RLS policies, and updated_at triggers.
--
-- Follows the conventions in supabase-schema.sql:
--   - UUID PRIMARY KEY via uuid_generate_v4()
--   - user_id is a plain UUID (Supabase Auth manages the users table separately)
--   - CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS (idempotent)
--   - RLS enabled with per-user policies
--   - DROP TRIGGER IF EXISTS before CREATE TRIGGER (re-runnable)
--
-- NOTE: The columns `behavior`, `reward`, `friction`, `location` are included
-- because the frontend (including the AI habit parser) sends them on habit
-- creation. They are nullable so older rows / partial submissions still work.
-- =============================================================================

-- Extension required for uuid_generate_v4() — already created by the main
-- schema, but kept here so this file is safe to run standalone.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- -----------------------------------------------------------------------------
-- habits
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'health'
                  CHECK (category IN ('health', 'work', 'home', 'mind')),
  icon            TEXT DEFAULT 'clock',
  color           TEXT DEFAULT 'var(--primary)',
  frequency       TEXT NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily', 'specific_days', 'x_per_week')),
  frequency_value INTEGER NOT NULL DEFAULT 1,
  scheduled_days  JSONB NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
  reminder_time   TEXT,
  reminder_tone   TEXT DEFAULT 'gentle'
                  CHECK (reminder_tone IN ('gentle', 'direct', 'silent')),
  anchor_routine  TEXT,
  anchor_id       TEXT,
  -- Structured cue (trigger) — the type of trigger plus optional time / window.
  -- cue_type: 'time' | 'window' | 'routine' | 'place' | 'event' | 'custom'.
  -- cue_time_start / cue_time_end: 'HH:MM' for time + window types; NULL otherwise.
  cue_type        TEXT,
  cue_time_start  TEXT,
  cue_time_end    TEXT,
  linked_goal_id  TEXT,
  visible_to_team BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at     TIMESTAMP WITH TIME ZONE,
  -- Commitment period (optional). target_days is the user's chosen length;
  -- start_date / end_date are populated when they pick a custom date range.
  target_days     INTEGER,
  start_date      DATE,
  end_date        DATE,
  -- Structured implementation-intention fields (populated by the AI parser
  -- or filled manually in the Add Habit form).
  behavior        TEXT,
  reward          TEXT,
  friction        TEXT,
  location        TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Backfill columns on a pre-existing habits table that was created from an
-- older version of the schema (no-op if they already exist).
ALTER TABLE habits ADD COLUMN IF NOT EXISTS behavior       TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS reward         TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS friction       TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS location       TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS cue_type       TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS cue_time_start TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS cue_time_end   TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_days    INTEGER;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date     DATE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS end_date       DATE;


-- -----------------------------------------------------------------------------
-- habit_completions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habit_completions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id     UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'done'
               CHECK (status IN ('done', 'partial', 'skipped')),
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- habit_streaks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habit_streaks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id          UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_habits_user_id        ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active      ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_linked_goal_id ON habits(linked_goal_id);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id      ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id     ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON habit_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_id  ON habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_habit_id ON habit_streaks(habit_id);


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks     ENABLE ROW LEVEL SECURITY;

-- habits — direct ownership by user_id
-- Each policy is dropped first so the whole file can be re-run safely
-- (Postgres has no CREATE POLICY IF NOT EXISTS).
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON habits;
CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;
CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- habit_completions — direct ownership by user_id
DROP POLICY IF EXISTS "Users can view their own habit completions" ON habit_completions;
CREATE POLICY "Users can view their own habit completions"
  ON habit_completions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit completions" ON habit_completions;
CREATE POLICY "Users can insert their own habit completions"
  ON habit_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit completions" ON habit_completions;
CREATE POLICY "Users can update their own habit completions"
  ON habit_completions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit completions" ON habit_completions;
CREATE POLICY "Users can delete their own habit completions"
  ON habit_completions FOR DELETE
  USING (auth.uid() = user_id);

-- habit_streaks — direct ownership by user_id
DROP POLICY IF EXISTS "Users can view their own habit streaks" ON habit_streaks;
CREATE POLICY "Users can view their own habit streaks"
  ON habit_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit streaks" ON habit_streaks;
CREATE POLICY "Users can insert their own habit streaks"
  ON habit_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit streaks" ON habit_streaks;
CREATE POLICY "Users can update their own habit streaks"
  ON habit_streaks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit streaks" ON habit_streaks;
CREATE POLICY "Users can delete their own habit streaks"
  ON habit_streaks FOR DELETE
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- updated_at triggers
--
-- The update_updated_at_column() function is defined in the main schema; we
-- re-declare it here with CREATE OR REPLACE FUNCTION so this file is safe to
-- run on its own.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habit_streaks_updated_at ON habit_streaks;
CREATE TRIGGER update_habit_streaks_updated_at BEFORE UPDATE ON habit_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
