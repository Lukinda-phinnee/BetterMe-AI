/**
 * Behavior Profile Schema
 * 
 * Core schema for the AI Growth Engine.
 * This stores the behavioral state that the AI uses for personalized coaching.
 * 
 * Following the spec: This is now core schema, not an afterthought.
 * The engine's quality depends on this data.
 */

import { pgTable, serial, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

export const behaviorProfile = pgTable('behavior_profile', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  
  // User's stated goals and values (for identity-linked framing)
  statedGoals: jsonb('stated_goals').$type<string[]>().default([]),
  coreValues: jsonb('core_values').$type<string[]>().default([]),
  
  // Reliable anchor routines (for habit-stacking)
  anchorRoutines: jsonb('anchor_routines').$type<Array<{
    name: string;
    time: string;
    reliability: number; // 0-1 score based on completion history
  }>>().default([]),
  
  // Preferred nudge tone and frequency
  preferredTone: text('preferred_tone').$type<'warm' | 'encouraging' | 'reflective'>().default('warm'),
  nudgeFrequency: text('nudge_frequency').$type<'low' | 'medium' | 'high'>().default('medium'),
  
  // WOOP entries for structured goal setting
  woopEntries: jsonb('woop_entries').$type<Array<{
    goalId: string;
    wish: string;
    outcome: string;
    obstacle: string;
    plan: string;
    createdAt: string;
  }>>().default([]),
  
  // Historical completion patterns (for realistic estimates)
  completionHistory: jsonb('completion_history').$type<Array<{
    category: string;
    estimatedMinutes: number;
    actualMinutes: number;
    completedAt: string;
  }>>().default([]),
  
  // Feature flags for AI capabilities
  featuresEnabled: jsonb('features_enabled').$type<{
    goalDecomposition: boolean;
    cardSummarization: boolean;
    coaching: boolean;
    woop: boolean;
    habitStacking: boolean;
  }>().default({
    goalDecomposition: true,
    cardSummarization: true,
    coaching: false,
    woop: false,
    habitStacking: false
  }),
  
  // Privacy settings
  shareWithOrg: boolean('share_with_org').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type BehaviorProfile = typeof behaviorProfile.$inferSelect;
export type NewBehaviorProfile = typeof behaviorProfile.$inferInsert;
