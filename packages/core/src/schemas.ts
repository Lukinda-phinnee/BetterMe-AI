import { z } from 'zod'

// Validation schemas using Zod

export const workspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export const boardSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export const listSchema = z.object({
  board_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  position: z.number().int().min(0),
  wip_limit: z.number().int().min(0).optional(),
})

export const cardSchema = z.object({
  board_id: z.string().uuid(),
  list_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  position: z.number().int().min(0),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['urgent', 'important', 'normal', 'low']).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string().uuid()).optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
})

export const behaviorProfileSchema = z.object({
  goals: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  anchor_routines: z.array(z.string()).optional(),
  preferred_tone: z.enum(['coach', 'direct', 'formal']).optional(),
  nudge_frequency: z.enum(['daily', 'weekly', 'biweekly']).optional(),
})
