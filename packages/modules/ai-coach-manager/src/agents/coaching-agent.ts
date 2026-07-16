/**
 * Coaching Agent
 * 
 * Provides autonomy-supportive coaching based on user's task patterns.
 * Grounded in Self-Determination Theory: support autonomy, competence, relatedness.
 */

import { z } from 'zod';
import { prompts } from './prompts';

// Schema for coaching output
const CoachingSchema = z.object({
  patterns: z.array(z.string()),
  celebrations: z.array(z.string()),
  curiousQuestions: z.array(z.string()),
  optionalExperiments: z.array(z.object({
    title: z.string(),
    description: z.string(),
    whyItMightHelp: z.string()
  })),
  coachingTone: z.enum(['warm', 'encouraging', 'reflective'])
});

export type CoachingResult = z.infer<typeof CoachingSchema>;

/**
 * Provide coaching based on user's task patterns
 */
export async function coachingAgent(
  userData: {
    taskHistory: Array<{
      title: string;
      completed: boolean;
      overdue: boolean;
      category?: string;
      completionTime?: number;
    }>;
    statedGoals?: string[];
    timeFrame?: 'week' | 'month';
  },
  apiKey?: string
): Promise<CoachingResult> {
  if (!apiKey) {
    throw new Error('Groq API key is required for AI operations');
  }

  try {
    const context = `
Task History:
${userData.taskHistory.map(t => 
  `${t.completed ? '✓' : t.overdue ? '!' : '○'} ${t.title}${t.category ? ` (${t.category})` : ''}${t.completionTime ? ` - ${t.completionTime}min` : ''}`
).join('\n')}

Stated Goals:
${userData.statedGoals?.map(g => `- ${g}`).join('\n') || 'None specified'}

Time Frame: ${userData.timeFrame || 'week'}
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
            content: `${prompts.coaching}\n\nRespond with valid JSON only, no markdown formatting.` 
          },
          { 
            role: 'user', 
            content: `User Data:\n${context}` 
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const parsed = CoachingSchema.parse(JSON.parse(data.choices[0].message.content));
    return parsed;
  } catch (error) {
    console.error('Coaching failed:', error);
    throw new Error('Failed to generate coaching insights. Please try again.');
  }
}
