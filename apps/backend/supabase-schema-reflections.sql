-- =============================================================================
-- Migration & Master Schema: Weekly Reflections Module
-- =============================================================================
-- Safe migration & creation script for `weekly_reflections`.
-- Safe to execute repeatedly in Supabase SQL Editor or via CLI migrations.
-- =============================================================================

-- Ensure extension exists for uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table Creation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Step 4 Reflection responses (Get Creative phase)
  worked_well TEXT,
  didnt_work TEXT,
  patterns TEXT,
  
  -- Step 4 & 5 Commitments (If-Then Intention & WOOP Obstacles)
  adjustment TEXT,
  implementation TEXT,
  
  -- Full Snapshot (Step 1-5 state: energy, stress, top 3 priorities, motto, habits & goals snapshot)
  week_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns safely if upgrading an existing table instance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reflections' AND column_name = 'patterns') THEN
    ALTER TABLE weekly_reflections ADD COLUMN patterns TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reflections' AND column_name = 'adjustment') THEN
    ALTER TABLE weekly_reflections ADD COLUMN adjustment TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reflections' AND column_name = 'implementation') THEN
    ALTER TABLE weekly_reflections ADD COLUMN implementation TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_reflections' AND column_name = 'week_data') THEN
    ALTER TABLE weekly_reflections ADD COLUMN week_data JSONB;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Constraints & Indexes
-- -----------------------------------------------------------------------------
-- Unique constraint to enforce max 1 reflection per user per week_start
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_week'
  ) THEN
    ALTER TABLE weekly_reflections ADD CONSTRAINT unique_user_week UNIQUE (user_id, week_start);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_week_start ON weekly_reflections(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start);

-- -----------------------------------------------------------------------------
-- 3. Automatic updated_at Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_weekly_reflections_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_weekly_reflections_updated_at ON weekly_reflections;
CREATE TRIGGER trg_update_weekly_reflections_updated_at
  BEFORE UPDATE ON weekly_reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_reflections_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely to allow clean re-execution
DROP POLICY IF EXISTS "Users can view own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can delete own reflections" ON weekly_reflections;

-- Re-create RLS Policies
CREATE POLICY "Users can view own reflections"
  ON weekly_reflections FOR SELECT
  USING (auth.uid() = user_id OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own reflections"
  ON weekly_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own reflections"
  ON weekly_reflections FOR UPDATE
  USING (auth.uid() = user_id OR user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own reflections"
  ON weekly_reflections FOR DELETE
  USING (auth.uid() = user_id OR user_id::text = auth.uid()::text);
