/**
 * AI Routes
 *
 * API endpoints for AI-powered features.
 * Handles goal decomposition, card summarization, coaching, chat history,
 * WOOP goal setting, and habit-stacking suggestions.
 */

import { Router } from 'express';
import {
  goalDecompositionAgent,
  cardSummarizationAgent,
  coachingAgent,
  chatAgent,
  woopAgent,
  habitStackingAgent,
} from '@betterme/module-ai-coach-manager';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a context block from the user's current board/task state
 * to inject into every chat prompt so the AI knows what's on the user's plate.
 */
async function buildUserContext(userId: string): Promise<string> {
  try {
    const { data: cards } = await supabase
      .from('cards')
      .select('title, priority, due_date, list_id')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .limit(10);

    const { data: profile } = await supabase
      .from('behavior_profiles')
      .select('goals, values, anchor_routines, preferred_tone, nudge_frequency')
      .eq('user_id', userId)
      .single();

    let ctx = '';

    if (profile) {
      if (profile.goals?.length)
        ctx += `\nUser's stated goals: ${profile.goals.join(', ')}.`;
      if (profile.values?.length)
        ctx += `\nUser's values: ${profile.values.join(', ')}.`;
      if (profile.anchor_routines?.length)
        ctx += `\nUser's existing routines: ${profile.anchor_routines.join(', ')}.`;
      if (profile.preferred_tone)
        ctx += `\nPreferred coaching tone: ${profile.preferred_tone}.`;
    }

    if (cards?.length) {
      const formatted = cards
        .map(c => {
          const due = c.due_date ? ` (due ${new Date(c.due_date).toLocaleDateString()})` : '';
          const pri = c.priority ? ` [${c.priority}]` : '';
          return `- ${c.title}${pri}${due}`;
        })
        .join('\n');
      ctx += `\n\nUser's current tasks:\n${formatted}`;
    }

    return ctx.trim();
  } catch {
    return '';
  }
}

// ─── Goal Decomposition ───────────────────────────────────────────────────────

router.post('/decompose-goal', async (req, res) => {
  try {
    const { goalText, context } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!goalText) return res.status(400).json({ error: 'goalText is required' });
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    const result = await goalDecompositionAgent(goalText, context, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Goal decomposition error:', error);
    res.status(500).json({ error: 'Failed to decompose goal' });
  }
});

// ─── Card Summarization ───────────────────────────────────────────────────────

router.post('/summarize-card', async (req, res) => {
  try {
    const { cardData } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!cardData) return res.status(400).json({ error: 'cardData is required' });
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    const result = await cardSummarizationAgent(cardData, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Card summarization error:', error);
    res.status(500).json({ error: 'Failed to summarize card' });
  }
});

// ─── Coaching Insights ────────────────────────────────────────────────────────

router.post('/coaching', async (req, res) => {
  try {
    const { userData } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!userData) return res.status(400).json({ error: 'userData is required' });
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    const result = await coachingAgent(userData, apiKey);
    res.json(result);
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ error: 'Failed to generate coaching insights' });
  }
});

// ─── WOOP Goal Setting ────────────────────────────────────────────────────────

router.post('/woop', authMiddleware, async (req, res) => {
  try {
    const { goalText, category } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!goalText) return res.status(400).json({ error: 'goalText is required' });
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    const result = await woopAgent({ goalText, category }, apiKey);
    res.json(result);
  } catch (error) {
    console.error('WOOP error:', error);
    res.status(500).json({ error: 'Failed to generate WOOP plan' });
  }
});

// ─── Habit Stacking ───────────────────────────────────────────────────────────

router.post('/habit-stack', authMiddleware, async (req, res) => {
  try {
    const { newHabitGoal, goalType } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!newHabitGoal) return res.status(400).json({ error: 'newHabitGoal is required' });
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    // Load the user's behavior profile
    const { data: profile } = await supabase
      .from('behavior_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const mockProfile = profile ?? {
      id: 'mock',
      user_id: req.user.id,
      anchor_routines: ['morning coffee', 'brushing teeth at night', 'logging off work'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await habitStackingAgent(
      { profile: mockProfile as any, newHabitGoal, goalType: goalType ?? 'habit' },
      apiKey
    );
    res.json(result);
  } catch (error) {
    console.error('Habit stacking error:', error);
    res.status(500).json({ error: 'Failed to suggest habit anchor' });
  }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: 'messages array is required' });
    if (!apiKey)
      return res.status(500).json({ error: 'Groq API key not configured' });

    // Build user context block (tasks + behavior profile) and inject as a
    // system-level note so the AI can reference what's on the user's plate.
    const userCtx = await buildUserContext(req.user.id);
    const messagesWithContext = userCtx
      ? [
          {
            role: 'system' as const,
            content: `Context about this user's current situation:\n${userCtx}`,
          },
          ...messages,
        ]
      : messages;

    const result = await chatAgent(messagesWithContext, apiKey);

    // Persist the new user message + AI reply if conversation exists
    if (conversationId) {
      const userMessage = messages[messages.length - 1];

      await supabase.from('chat_messages').insert([
        {
          conversation_id: conversationId,
          role: userMessage.role,
          content: userMessage.content,
        },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: result.text,
        },
      ]);

      // Bump the conversation's updated_at timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', req.user.id);
    }

    res.json({ response: result.text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});

// ─── Conversation CRUD ────────────────────────────────────────────────────────

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: req.user.id, title: title || 'New Chat' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.put('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (convError || !conversation)
      return res.status(404).json({ error: 'Conversation not found' });

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// ─── Auto-generate Conversation Title ────────────────────────────────────────
//
// Called after the first or second AI exchange. Reads the first few user
// messages from the conversation and asks the model for a short, human title.

router.post('/conversations/:id/generate-title', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    // Verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, title')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (convError || !conversation)
      return res.status(404).json({ error: 'Conversation not found' });

    // Fetch the first 3 messages (enough context without wasting tokens)
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(4);

    if (msgError || !messages || messages.length === 0)
      return res.status(400).json({ error: 'No messages yet' });

    // Extract only user messages to judge meaningfulness
    const userMessages = messages.filter((m: { role: string; content: string }) => m.role === 'user');
    if (userMessages.length === 0)
      return res.status(400).json({ error: 'No user messages yet' });

    const excerpt = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a chat title generator. Given the start of a coaching conversation, produce a concise title of 3-6 words that captures what the user wants help with. 
Rules:
- Be specific and human (not generic like "General Chat" or "Conversation")
- Use sentence case, no quotes, no punctuation at end
- If the message is too vague (e.g. "hi", "hello", "ok"), return exactly: __SKIP__
- Return ONLY the title, nothing else`
          },
          {
            role: 'user',
            content: `Conversation so far:\n${excerpt}\n\nGenerate a title:`
          }
        ],
        temperature: 0.4,
        max_tokens: 20,
      }),
    });

    if (!response.ok) return res.status(500).json({ error: 'AI title generation failed' });

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const rawTitle = data.choices[0].message.content.trim();

    // If AI determined the message is too vague, don't update
    if (rawTitle === '__SKIP__') {
      return res.json({ title: conversation.title, skipped: true });
    }

    // Save the AI-generated title
    const { data: updated, error: updateError } = await supabase
      .from('chat_conversations')
      .update({ title: rawTitle })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ title: rawTitle, conversation: updated });
  } catch (error) {
    console.error('Generate title error:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
});

export default router;
