-- Migration: Add card_comments and card_activity_log tables
-- These tables support comments and analytics (cycle-time tracking) per spec

-- Create card_comments table
CREATE TABLE IF NOT EXISTS card_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_activity_log table for analytics
CREATE TABLE IF NOT EXISTS card_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_card_comments_card_id ON card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_user_id ON card_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_card_id ON card_activity_log(card_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_user_id ON card_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_created_at ON card_activity_log(created_at);
