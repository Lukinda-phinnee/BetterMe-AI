-- Migration: Update cards table with new fields
-- This adds fields needed for the enhanced task form according to spec

-- Add new columns to cards table
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS due_date_reminder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS column_status TEXT CHECK (column_status IN ('todo', 'in-progress', 'review', 'done'));

-- Update priority constraint to match new values (high, medium, low)
ALTER TABLE cards 
DROP CONSTRAINT IF EXISTS cards_priority_check;

ALTER TABLE cards 
ADD CONSTRAINT cards_priority_check 
CHECK (priority IN ('high', 'medium', 'low'));

-- Set default values for existing records
UPDATE cards 
SET column_status = 'todo' 
WHERE column_status IS NULL;

UPDATE cards 
SET color = '#e0f2fe' 
WHERE color IS NULL;

UPDATE cards 
SET priority = 'medium' 
WHERE priority NOT IN ('high', 'medium', 'low');
