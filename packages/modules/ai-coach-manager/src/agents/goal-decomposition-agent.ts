/**
 * Goal Decomposition Agent
 * 
 * Turns vague goals into concrete next actions using Tiny Habits principle.
 * This is the first AI capability in the rollout order (reactive core).
 */

import { z } from 'zod';
import { prompts } from './prompts';

// Schema for goal decomposition output
const GoalDecompositionSchema = z.object({
  originalGoal: z.string(),
  isConcrete: z.boolean(),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    estimatedMinutes: z.number(),
    implementationIntention: z.string()
  }),
  followUpSteps: z.array(z.object({
    title: z.string(),
    description: z.string(),
    estimatedMinutes: z.number()
  })),
  coachingNote: z.string()
});

export type GoalDecompositionResult = z.infer<typeof GoalDecompositionSchema>;

/**
 * Decompose a vague goal into concrete next actions
 */
export async function goalDecompositionAgent(
  goalText: string,
  context?: string,
  apiKey?: string
): Promise<GoalDecompositionResult> {
  if (!apiKey) {
    throw new Error('Groq API key is required for AI operations');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: `${prompts.goalDecomposition}\n\nRespond with valid JSON only, no markdown formatting.` 
          },
          { 
            role: 'user', 
            content: `Goal: ${goalText}${context ? `\n\nContext: ${context}` : ''}` 
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const parsed = GoalDecompositionSchema.parse(JSON.parse(data.choices[0].message.content));
    return parsed;
  } catch (error) {
    console.error('Goal decomposition failed:', error);
    throw new Error('Failed to decompose goal. Please try again.');
  }
}
