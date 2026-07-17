-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing foreign key constraint if it exists
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_fkey;

-- Workspaces table (no foreign key to users since Supabase Auth manages users separately)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  list_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'medium',
  labels JSONB DEFAULT '[]',
  assignees JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  color VARCHAR(7) DEFAULT '#e0f2fe',
  column_status VARCHAR(50) DEFAULT 'todo',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make list_id nullable if the table already exists with it as NOT NULL
ALTER TABLE cards ALTER COLUMN list_id DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_status ON cards(column_status);

-- Enable Row Level Security (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their own workspaces" 
ON workspaces FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspaces" 
ON workspaces FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspaces" 
ON workspaces FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspaces" 
ON workspaces FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for boards (through workspace ownership)
CREATE POLICY "Users can view boards in their workspaces" 
ON boards FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = boards.workspace_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert boards in their workspaces" 
ON boards FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = boards.workspace_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update boards in their workspaces" 
ON boards FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = boards.workspace_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete boards in their workspaces" 
ON boards FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = boards.workspace_id 
    AND workspaces.user_id = auth.uid()
  )
);

-- RLS Policies for cards (through board ownership)
CREATE POLICY "Users can view cards in their boards" 
ON cards FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    JOIN workspaces ON workspaces.id = boards.workspace_id 
    WHERE boards.id = cards.board_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert cards in their boards" 
ON cards FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards 
    JOIN workspaces ON workspaces.id = boards.workspace_id 
    WHERE boards.id = cards.board_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update cards in their boards" 
ON cards FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    JOIN workspaces ON workspaces.id = boards.workspace_id 
    WHERE boards.id = cards.board_id 
    AND workspaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete cards in their boards" 
ON cards FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM boards 
    JOIN workspaces ON workspaces.id = boards.workspace_id 
    WHERE boards.id = cards.board_id 
    AND workspaces.user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Chat Conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- Enable RLS for chat tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own chat conversations" 
ON chat_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat conversations" 
ON chat_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat conversations" 
ON chat_conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat conversations" 
ON chat_conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for chat_messages (through conversation ownership)
CREATE POLICY "Users can view messages in their conversations" 
ON chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE chat_conversations.id = chat_messages.conversation_id 
    AND chat_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations" 
ON chat_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE chat_conversations.id = chat_messages.conversation_id 
    AND chat_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in their conversations" 
ON chat_messages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations 
    WHERE chat_conversations.id = chat_messages.conversation_id 
    AND chat_conversations.user_id = auth.uid()
  )
);

-- Triggers to auto-update updated_at for chat tables
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Goals table (WOOP method)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  wish TEXT NOT NULL,
  outcome TEXT NOT NULL,
  obstacle TEXT NOT NULL,
  plan TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for goals table
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_board_id ON goals(board_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Enable RLS for goals table
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals" 
ON goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON goals FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at for goals
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
