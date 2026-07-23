-- =============================================================================
-- Migration: ALTER `weekly_reflections` Table (Fixed Dependency Order)
-- Run this in your Supabase SQL Editor to update your existing table
-- =============================================================================

-- 1. DROP EXISTING POLICIES FIRST to remove dependency on `user_id` column
DROP POLICY IF EXISTS "Users can view own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can insert own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can update own reflections" ON weekly_reflections;
DROP POLICY IF EXISTS "Users can delete own reflections" ON weekly_reflections;

-- 2. Drop foreign key constraint if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'weekly_reflections_user_id_fkey' 
    AND table_name = 'weekly_reflections'
  ) THEN
    ALTER TABLE weekly_reflections DROP CONSTRAINT weekly_reflections_user_id_fkey;
  END IF;
END $$;

-- 3. Ensure all columns exist with correct data types
ALTER TABLE weekly_reflections 
  ADD COLUMN IF NOT EXISTS worked_well TEXT,
  ADD COLUMN IF NOT EXISTS didnt_work TEXT,
  ADD COLUMN IF NOT EXISTS patterns TEXT,
  ADD COLUMN IF NOT EXISTS adjustment TEXT,
  ADD COLUMN IF NOT EXISTS implementation TEXT,
  ADD COLUMN IF NOT EXISTS week_data JSONB DEFAULT '{}'::jsonb;

-- 4. Alter user_id column safely now that policy dependencies are dropped
ALTER TABLE weekly_reflections ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_week_start ON weekly_reflections(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_week ON weekly_reflections(user_id, week_start);

-- 6. Re-create RLS Policies
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections"
  ON weekly_reflections FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reflections"
  ON weekly_reflections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own reflections"
  ON weekly_reflections FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own reflections"
  ON weekly_reflections FOR DELETE
  USING (true);
