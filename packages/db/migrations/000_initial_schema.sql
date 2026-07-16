-- Complete Database Schema for BetterMe Task Management System
-- This script creates all tables needed for the task/card system according to spec

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table (columns in board)
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    wip_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (tasks)
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    due_date_reminder BOOLEAN DEFAULT false,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    labels JSONB DEFAULT '[]'::jsonb,
    assignees JSONB DEFAULT '[]'::jsonb,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    checklist JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    color TEXT,
    column_status TEXT CHECK (column_status IN ('todo', 'in-progress', 'review', 'done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card comments table
CREATE TABLE IF NOT EXISTS card_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card activity log table for analytics (cycle-time tracking)
CREATE TABLE IF NOT EXISTS card_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    changes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavior profiles table (AI Growth Engine)
CREATE TABLE IF NOT EXISTS behavior_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goals JSONB DEFAULT '{}'::jsonb,
    values JSONB DEFAULT '{}'::jsonb,
    anchor_routines JSONB DEFAULT '{}'::jsonb,
    preferred_tone TEXT CHECK (preferred_tone IN ('coach', 'direct', 'formal')),
    nudge_frequency TEXT CHECK (nudge_frequency IN ('daily', 'weekly', 'biweekly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_status ON cards(column_status);
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
CREATE INDEX IF NOT EXISTS idx_cards_priority ON cards(priority);
CREATE INDEX IF NOT EXISTS idx_card_comments_card_id ON card_comments(card_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_user_id ON card_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_card_id ON card_activity_log(card_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_user_id ON card_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_created_at ON card_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_user_id ON behavior_profiles(user_id);

-- Enable JSONB GIN indexes for better JSONB query performance
CREATE INDEX IF NOT EXISTS idx_cards_labels ON cards USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_cards_assignees ON cards USING GIN(assignees);
CREATE INDEX IF NOT EXISTS idx_cards_checklist ON cards USING GIN(checklist);
CREATE INDEX IF NOT EXISTS idx_cards_attachments ON cards USING GIN(attachments);
CREATE INDEX IF NOT EXISTS idx_card_activity_log_changes ON card_activity_log USING GIN(changes);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_goals ON behavior_profiles USING GIN(goals);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_values ON behavior_profiles USING GIN(values);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_anchor_routines ON behavior_profiles USING GIN(anchor_routines);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_comments_updated_at BEFORE UPDATE ON card_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavior_profiles_updated_at BEFORE UPDATE ON behavior_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
