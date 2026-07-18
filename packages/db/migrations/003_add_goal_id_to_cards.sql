-- Migration: Add goal_id to cards
--
-- Links a task (card) to the WOOP goal it belongs to, so the Goals page
-- side panel can group tasks under their parent goal. Nullable because most
-- existing cards were created independently of any goal.
--
-- On goal deletion the card is kept (goal_id set to NULL), which matches how
-- the rest of the app treats orphaned tasks.

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cards_goal_id ON cards(goal_id);
