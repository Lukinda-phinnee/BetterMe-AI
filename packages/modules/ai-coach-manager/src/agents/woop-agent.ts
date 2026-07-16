/**
 * WOOP Agent
 * 
 * Walks users through Wish, Outcome, Obstacle, Plan for bigger goals.
 * Grounded in Oettingen's mental contrasting research.
 */

import { z } from 'zod';
import { prompts } from './prompts';

// Schema for WOOP output
const WOOPSchema = z.object({
  wish: z.string(),
  outcome: z.object({
    description: z.string(),
    howItFeels: z.string()
  }),
  obstacle: z.object({
    description: z.string(),
    whenItHappens: z.string()
  }),
  plan: z.object({
    ifThen: z.string(),
    specificAction: z.string()
  })
});

export type WOOPResult = z.infer<typeof WOOPSchema>;

/**
 * Draft a WOOP based on user's goal
 */
export async function woopAgent(
  goalData: {
    goalText: string;
    category?: string;
  },
  apiKey?: string
): Promise<WOOPResult> {
  if (!apiKey) {
    throw new Error('Groq API key is required for AI operations');
  }

  try {
    const context = `
Goal: ${goalData.goalText}
${goalData.category ? `Category: ${goalData.category}` : ''}
    `.trim();

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
            content: `${prompts.woop}\n\nRespond with valid JSON only, no markdown formatting.` 
          },
          { 
            role: 'user', 
            content: `User Data:\n${context}` 
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
    const parsed = WOOPSchema.parse(JSON.parse(data.choices[0].message.content));
    return parsed;
  } catch (error) {
    console.error('WOOP draft failed:', error);
    throw new Error('Failed to generate WOOP draft. Please try again.');
  }
}
