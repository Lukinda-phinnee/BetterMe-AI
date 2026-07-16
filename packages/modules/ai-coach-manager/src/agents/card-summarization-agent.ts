/**
 * Card Summarization Agent
 * 
 * Provides concise summaries of cards, threads, or activity logs.
 * Useful for quick context understanding and weekly reviews.
 */

import { z } from 'zod';
import { prompts } from './prompts';

// Schema for card summarization output
const CardSummarizationSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  progress: z.string(),
  blockers: z.array(z.string()),
  nextSteps: z.array(z.string()),
  timeSensitive: z.boolean(),
  priority: z.enum(['low', 'medium', 'high'])
});

export type CardSummarizationResult = z.infer<typeof CardSummarizationSchema>;

/**
 * Summarize a card or thread
 */
export async function cardSummarizationAgent(
  cardData: {
    title: string;
    description?: string;
    checklist?: Array<{ text: string; completed: boolean }>;
    comments?: Array<{ text: string; author: string; timestamp: string }>;
    activityLog?: Array<{ action: string; timestamp: string }>;
  },
  apiKey?: string
): Promise<CardSummarizationResult> {
  if (!apiKey) {
    throw new Error('Groq API key is required for AI operations');
  }

  try {
    const cardContext = `
Title: ${cardData.title}
Description: ${cardData.description || 'None'}
Checklist: ${cardData.checklist?.map(c => `${c.completed ? '✓' : '○'} ${c.text}`).join('\n') || 'None'}
Comments: ${cardData.comments?.map(c => `${c.author}: ${c.text}`).join('\n') || 'None'}
Activity: ${cardData.activityLog?.map(a => `${a.action} at ${a.timestamp}`).join('\n') || 'None'}
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
            content: `${prompts.cardSummarization}\n\nRespond with valid JSON only, no markdown formatting.` 
          },
          { 
            role: 'user', 
            content: `Card Data:\n${cardContext}` 
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const parsed = CardSummarizationSchema.parse(JSON.parse(data.choices[0].message.content));
    return parsed;
  } catch (error) {
    console.error('Card summarization failed:', error);
    throw new Error('Failed to summarize card. Please try again.');
  }
}
