/**
 * Habit Stacking Agent
 * 
 * Suggests habit-stacking anchor prompts based on a user's behavior profile.
 * Grounded in BJ Fogg's Tiny Habits and James Clear's Atomic Habits.
 */

import { z } from 'zod';
import type { BehaviorProfile } from '@betterme/core';


// Schema for Habit Stacking output
const HabitStackingSchema = z.object({
  suggestedAnchor: z.string(),
  reasoning: z.string(),
  alternativeAnchors: z.array(z.string()),
  implementationIntention: z.string()
});

export type HabitStackingResult = z.infer<typeof HabitStackingSchema>;

/**
 * Suggest an anchor prompt for a new habit based on existing routines
 */
export async function habitStackingAgent(
  data: {
    profile: BehaviorProfile;
    newHabitGoal: string;
    goalType: 'habit' | 'task' | 'routine';
  },
  apiKey?: string
): Promise<HabitStackingResult> {
  if (!apiKey) {
    throw new Error('Groq API key is required for AI operations');
  }

  try {
    const context = `
New Habit Goal: ${data.newHabitGoal}
Goal Type: ${data.goalType}

User's Existing Anchor Routines:
${data.profile.anchor_routines?.length ? (data.profile.anchor_routines as string[]).map((r: string) => `- ${r}`).join('\n') : 'None explicitly specified. Assume common daily routines (waking up, making coffee, brushing teeth).'}
    `.trim();

    const systemPrompt = `You are a behavior change expert specializing in habit stacking.
Your goal is to suggest the best existing routine to anchor a new habit to.
Habit stacking formula: "After [CURRENT HABIT], I will [NEW HABIT]."

Choose an anchor that naturally matches the time, location, and frequency of the new habit.
Explain your reasoning briefly and supportively.`;

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
            content: `${systemPrompt}\n\nRespond with valid JSON only, no markdown formatting.` 
          },
          { 
            role: 'user', 
            content: `User Data:\n${context}` 
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const parsed = HabitStackingSchema.parse(JSON.parse(result.choices[0].message.content));
    return parsed;
  } catch (error) {
    console.error('Habit Stacking failed:', error);
    throw new Error('Failed to generate habit stacking suggestions. Please try again.');
  }
}
