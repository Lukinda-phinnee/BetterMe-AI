-- Migration: Add title_locked to chat_conversations
--
-- Once a conversation title has been set (either by the AI auto-titler at the
-- 3rd user message, a WOOP-wish derivation, or a manual rename), it should not
-- be overwritten by later AI auto-titling. This boolean gates that rule:
-- the auto-titler only runs when title_locked = FALSE, and every titling path
-- (auto, WOOP, manual PUT) sets it to TRUE.

ALTER TABLE chat_conversations
  ADD COLUMN IF NOT EXISTS title_locked BOOLEAN NOT NULL DEFAULT FALSE;
