/**
 * Chat Agent
 * 
 * Provides chat capabilities for interactive AI coaching.
 * Supports conversation with the AI coach.
 */

import { prompts } from './prompts';

/**
 * Generate chat response from AI coach using direct Groq API call
 */
export async function chatAgent(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  apiKey?: string
) {
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
          { role: 'system', content: prompts.chat },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return { text: data.choices[0].message.content };
  } catch (error) {
    console.error('Chat agent failed:', error);
    throw new Error('Failed to generate chat response. Please try again.');
  }
}
