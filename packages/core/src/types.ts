// Domain types for BetterMe

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  workspace_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  board_id: string
  name: string
  position: number
  wip_limit?: number
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  board_id: string
  list_id: string
  title: string
  description?: string
  position: number
  due_date?: string
  priority?: 'urgent' | 'important' | 'normal' | 'low'
  labels?: string[]
  assignees?: string[]
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
}

export interface BehaviorProfile {
  id: string
  user_id: string
  goals?: string[]
  values?: string[]
  anchor_routines?: string[]
  preferred_tone?: 'coach' | 'direct' | 'formal'
  nudge_frequency?: 'daily' | 'weekly' | 'biweekly'
  created_at: string
  updated_at: string
}
