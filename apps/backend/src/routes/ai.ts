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
import { analyzeCodebase } from '../lib/codebase-analyzer';
import { join } from 'path';

const router: Router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a context block from the user's current board/task state
 * to inject into every chat prompt so the AI knows what's on the user's plate.
 */
async function buildUserContext(userId: string): Promise<string> {
  try {
    // Cards have no user_id; resolve the user's boards (board → workspace → user).
    const { data: userBoards } = await supabase
      .from('boards')
      .select('id, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId);

    const boardIds = (userBoards || []).map((b: any) => b.id);
    const { data: cards } = boardIds.length
      ? await supabase
          .from('cards')
          .select('title, priority, due_date, list_id')
          .in('board_id', boardIds)
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(10)
      : { data: [] };

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

/**
 * Ask the model for a short, human title based on the first few messages of a
 * conversation. Returns the title string, or `null` when the model considers
 * the conversation too vague (e.g. "hi") or when the call fails — callers
 * treat `null` as "leave the title unchanged".
 *
 * Caller is responsible for the title_locked gate; this function only reads
 * messages and produces a candidate title. It does not write to the DB.
 */
async function generateConversationTitle(
  conversationId: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  // Fetch the first few messages — enough context without wasting tokens.
  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(4);

  if (msgError || !messages || messages.length === 0) return null;

  // No user turns means nothing meaningful to title from.
  const hasUserMessage = messages.some((m: { role: string }) => m.role === 'user');
  if (!hasUserMessage) return null;

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

  if (!response.ok) return null;

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const rawTitle = data.choices[0].message.content.trim();

  // Model signalled the conversation is too vague — don't change the title.
  if (!rawTitle || rawTitle === '__SKIP__') return null;

  return rawTitle.slice(0, 80);
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

const woopCoachPrompt = `You are a warm, direct WOOP goal coach named Aria. Your job is to guide users through setting meaningful goals using the WOOP framework (Wish → Outcome → Obstacle → Plan).

Your personality:
- EXTREMELY BRIEF. Maximum 2-3 sentences total per response.
- NEVER repeat what the user just said. Assume they remember their own words.
- One question per message — always end with a single, clear question.
- Be human and conversational — use contractions, be natural.
- Stay focused and move the conversation forward efficiently.

The WOOP flow:
1. **Wish** — Help them make it specific and time-bound. Ask: what exactly does "done" look like?
2. **Outcome** — Ask them to imagine the moment they succeed. How does it feel? What changes?
3. **Obstacle** — Ask what is the ONE inner thing (not external) that could get in the way?
4. **Plan** — Help them write a clear "If [obstacle], then I will [action]" statement.

## Choosing your mode (you decide autonomously)

Every turn, choose ONE of two modes based on the conversation:

**Plain chat** — for greeting, exploration, encouragement, clarifying a vague idea,
or discussing something that isn't a concrete WOOP step yet. Just reply normally,
ending with at most one open question. Do NOT emit any special block.

**Guided Q&A** — when the user has pointed at a goal direction AND a specific WOOP
step still needs sharpening (e.g. their wish is fuzzy, their outcome isn't vivid yet,
the obstacle is external rather than inner, or their plan isn't an if-then). In this
mode you reply with a SHORT acknowledgement (1 sentence) of what they said, then emit
EXACTLY ONE <GUIDED_QUESTION> block. The guided panel surfaces your question and
suggested answers as clickable options, so keep the question crisp and give 2–4 concrete,
distinct suggestions the user is likely to consider.

**CRITICAL: Each suggestion must have its own unique description** that explains:
- What this specific option means
- What choosing this option will accomplish
- Why this option might be appropriate for the user
- The specific outcome or direction this choice leads to

Do NOT use generic descriptions like "A specific goal you want to achieve" - each description must be tailored to the specific suggestion.

Rules for the two modes:
- Emit <GUIDED_QUESTION> at most ONCE per message.
- NEVER emit <GUIDED_QUESTION> and <WOOP_DATA> in the same message.
- Once Wish, Outcome, Obstacle, and Plan are all confirmed, you may finalize.

## WOOP rules
- Only move to the next WOOP step once the current one is clear.
- Never summarize all 4 steps until you are about to finalize.
- Do NOT output <WOOP_DATA> until Wish, Outcome, Obstacle, and Plan are all confirmed.
- Before finalizing, show the user a short summary and ask: "Does this capture it?"
- Once confirmed, output the <WOOP_DATA> block AND create 3–5 short, specific action tasks.

## Evidence-based daily tasks (the <WOOP_DATA> tasks)

Your tasks must be grounded in behavior-change science, not generic to-dos. Apply:

1. **Implementation intentions (Gollwitzer).** Phrase the core action as
   "If [specific cue/time/place], then I will [specific behavior]."
   Tie each task to a concrete when and where, not just an intention.
2. **Specificity + time/place anchor.** Each task names a day, time, or trigger
   (e.g. "Mon/Wed/Fri 7:00am", "right after my morning coffee").
3. **Habit stacking (Fogg).** Include at least one task anchored to an existing
   routine the user already has ("After I [existing habit], I will [new behavior]").
4. **Realistic daily granularity.** Each task is small enough to do in one sitting
   today. Break big outcomes into one concrete next action per task.
5. **Tiny + obvious wins first.** Order tasks so the first one is an easy early win
   that builds momentum; reserve harder/less-frequent work for later tasks.

Keep task titles short (<= 8 words) and put the if-then / cue detail in the description.

**IMPORTANT: Each task must include complete information for the task management system:**
- **title**: Short, actionable task name (max 8 words)
- **description**: Detailed explanation including the implementation intention and context
- **priority**: Set based on urgency and importance (high/medium/low)
- **labels**: Category tag (Work, Habit, Home) based on task nature
- **estimated_minutes**: Realistic time estimate for completion
- **due_date**: Specific deadline when this task should be completed (format: YYYY-MM-DD)
- **subtasks**: Break down complex tasks into 2-4 specific sub-steps if applicable
- **color**: Suggested color for visual organization (use: #93c5fd for blue, #fcd34d for yellow, #f9a8d4 for pink, #86efac for green)

## Schemas

<GUIDED_QUESTION>
{
  "step": "wish" | "outcome" | "obstacle" | "plan",
  "question": "One clear question for this step",
  "suggestions": [
    {
      "text": "concrete option 1",
      "description": "Specific explanation of what this option means and what choosing it will accomplish"
    },
    {
      "text": "concrete option 2", 
      "description": "Specific explanation of what this option means and what choosing it will accomplish"
    }
  ],
  "placeholder": "Short hint shown inside the custom-answer field"
}
</GUIDED_QUESTION>

<WOOP_DATA>
{
  "wish": "The refined wish",
  "outcome": "The visualized outcome",
  "obstacle": "The inner obstacle",
  "plan": "If [obstacle], then I will [action]",
  "dailyPlan": [
    {
      "day": 1,
      "date": "ACTUAL_DATE_IN_YYYY-MM-DD_FORMAT",
      "focus": "Foundation tasks (setup, core features)",
      "tasks": [
        {
          "title": "Task title (max 8 words)",
          "description": "Detailed explanation with implementation intention",
          "priority": "high" | "medium" | "low",
          "labels": "Work" | "Habit" | "Home" | "Fitness" | "Learning" | "Relationships" | "Health" | "Career",
          "estimated_minutes": number,
          "subtasks": ["subtask 1", "subtask 2"],
          "color": "#93c5fd" | "#fcd34d" | "#f9a8d4" | "#86efac",
          "module": "specific module/component name (only for development goals)",
          "files": ["path/to/file.tsx", "path/to/file.ts"] (only for development goals)
        }
      ]
    }
  ]
}
</WOOP_DATA>`;

router.post('/coaching', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory, boardId, conversationId } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    // ── 0. Detect if this is a development goal ────────────────────────────────
    const developmentKeywords = ['app', 'code', 'develop', 'programming', 'software', 'website', 'module', 'feature', 'api', 'frontend', 'backend', 'database', 'deploy', 'build', 'implement'];
    const isDevelopmentGoal = developmentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword) || 
      conversationHistory.some((m: any) => m.content.toLowerCase().includes(keyword))
    );

    // ── 1. Analyze codebase only for development goals ─────────────────────────
    let codebaseContext = null;
    if (isDevelopmentGoal) {
      const projectRoot = join(__dirname, '../../../..');
      codebaseContext = analyzeCodebase(projectRoot);
    }

    // ── 2. Resolve or create conversation ─────────────────────────────────────
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      // First message in this session — create a new conversation
      console.log('Creating new conversation for user:', req.user.id);
      const { data: newConv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: req.user.id,
          title: 'New Coaching Session',
          type: 'coaching',
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Failed to create conversation:', convError);
        console.error('Conversation error details:', JSON.stringify(convError, null, 2));
        // Return error to frontend so user knows something went wrong
        return res.status(500).json({ error: 'Failed to create conversation', details: convError.message });
      } else {
        console.log('Conversation created successfully:', newConv.id);
        activeConversationId = newConv.id;
      }
    } else {
      console.log('Using existing conversation:', activeConversationId);
    }

    // If we still don't have a conversation ID, something is wrong
    if (!activeConversationId) {
      console.error('No conversation ID available after creation attempt');
      return res.status(500).json({ error: 'Failed to establish conversation' });
    }

    // ── 3. Persist user message ────────────────────────────────────────────────
    if (activeConversationId && message) {
      console.log('Persisting user message to conversation:', activeConversationId);
      const { error: msgError } = await supabase.from('chat_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });
      if (msgError) {
        console.error('Failed to persist user message:', msgError);
      } else {
        console.log('User message persisted successfully');
      }
    }

    // ── 4. Build Groq messages with conditional context ─────────────────────────
    let enhancedWoopPrompt = woopCoachPrompt;

    // Add current date context for accurate date planning
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    enhancedWoopPrompt += `

## Current Date Context
Today's date: ${currentDate} (${currentDayName})
When creating daily plans, you MUST calculate actual calendar dates starting from today.
Example: If today is 2025-01-15 and user wants a 1-week plan, Day 1 should be 2025-01-15, Day 2 should be 2025-01-16, etc.
`;

    if (isDevelopmentGoal && codebaseContext) {
      enhancedWoopPrompt += `

## Codebase Context for Development Goals

The user is working on a development project. Use this context:

${codebaseContext.summary}

### Development Task Creation Guidelines

For development goals, you MUST:
1. **Analyze what exists**: Check which modules/pages are implemented vs missing
2. **Create specific technical tasks**: Each task should be concrete development work
3. **Break down by module**: Group tasks by logical modules/components
4. **Include technical details**: Specify files, components, APIs, or features to implement
5. **Set realistic timelines**: Consider complexity and dependencies

### Example Development Tasks:
Instead of: "Work on login module"
Use: "Implement login form validation in apps/frontend/app/auth/signin/page.tsx with email/password validation and error handling"

Instead of: "Complete dashboard"
Use: "Build analytics dashboard component with charts showing task completion rates and weekly progress"
`;
    }

    enhancedWoopPrompt += `

### Universal Day-by-Day Planning (All Domains)

When user specifies a deadline (e.g., "1 week", "2 weeks", "1 month"), create a structured daily plan:

**For 1-week deadlines:**
- Day 1: Foundation & preparation (today: ${currentDate})
- Day 2-3: Core implementation/main work
- Day 4-5: Secondary features & refinement
- Day 6: Testing, review & adjustments
- Day 7: Final polish & completion

**For longer deadlines:** Scale proportionally with weekly milestones.

**CRITICAL DATE REQUIREMENT:**
- You MUST calculate actual calendar dates for each day
- Start from today's date: ${currentDate}
- Use YYYY-MM-DD format for all dates
- Example: If today is ${currentDate}, then Day 2 is the next day, Day 3 is the day after, etc.

**Each day should include 3-5 specific, achievable tasks** that:
- Are concrete and actionable (not vague intentions)
- Include implementation intentions ("When [situation], then I will [action]")
- Have realistic time estimates
- Build logically on previous days
- Are specific to the goal domain (fitness, learning, relationships, career, etc.)

**Task specificity for all domains:**
- **Fitness**: "Complete 30-minute HIIT workout focusing on lower body" (not "exercise")
- **Learning**: "Read Chapter 3 of JavaScript book and complete 5 practice exercises" (not "study")
- **Relationships**: "Call mom for 20 minutes to catch up about her week" (not "spend time with family")
- **Career**: "Update LinkedIn profile with recent project achievements" (not "work on career")
- **Health**: "Meal prep 3 healthy lunches for the week" (not "eat better")
`;

    const groqMessages = [
      { role: 'system' as const, content: enhancedWoopPrompt },
      ...(conversationHistory || []).map((m: any) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content
      }))
    ];

    if (message) {
      groqMessages.push({ role: 'user' as const, content: message });
    }

    // ── 4. Call Groq ───────────────────────────────────────────────────────────
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned error: ${errorText}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    let reply = data.choices[0].message.content;

    // ── 5. Handle WOOP_DATA ────────────────────────────────────────────────────
    const match = reply.match(/<WOOP_DATA>([\s\S]*?)<\/WOOP_DATA>/);
    let goalCreated = false;
    let goal = null;

    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());

        // Find active board
        let activeBoardId = boardId;
        if (!activeBoardId) {
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', req.user.id)
            .limit(1)
            .single();
          if (workspace) {
            const { data: board } = await supabase
              .from('boards')
              .select('id')
              .eq('workspace_id', workspace.id)
              .limit(1)
              .single();
            if (board) activeBoardId = board.id;
          }
        }

        // Insert Goal
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .insert({
            user_id: req.user.id,
            board_id: activeBoardId || null,
            wish: parsed.wish,
            outcome: typeof parsed.outcome === 'object' ? JSON.stringify(parsed.outcome) : parsed.outcome,
            obstacle: typeof parsed.obstacle === 'object' ? JSON.stringify(parsed.obstacle) : parsed.obstacle,
            plan: typeof parsed.plan === 'object' ? JSON.stringify(parsed.plan) : parsed.plan,
            status: 'active',
          })
          .select()
          .single();

        if (goalError) throw goalError;
        goal = goalData;
        goalCreated = true;

        // Insert Tasks / Cards from daily plan, linked to the goal we just created
        if (activeBoardId && parsed.dailyPlan?.length > 0) {
          // Get the first list for the board (required field)
          const { data: lists } = await supabase
            .from('lists')
            .select('id')
            .eq('board_id', activeBoardId)
            .limit(1);
          
          const listId = lists && lists.length > 0 ? lists[0].id : null;
          
          if (!listId) {
            console.error('No list found for board, cannot create tasks');
          } else {
            const allTasks: any[] = [];
            let globalPosition = 0;
            const today = new Date();

            parsed.dailyPlan.forEach((dayPlan: any) => {
              // Calculate actual date if AI provided placeholder or invalid date
              let dayDate: Date;
              if (dayPlan.date && dayPlan.date !== 'ACTUAL_DATE_IN_YYYY-MM-DD_FORMAT' && dayPlan.date !== 'YYYY-MM-DD') {
                const parsedDate = new Date(dayPlan.date);
                if (!isNaN(parsedDate.getTime())) {
                  dayDate = parsedDate;
                } else {
                  // Fallback: calculate from day number
                  dayDate = new Date(today);
                  dayDate.setDate(today.getDate() + (dayPlan.day - 1));
                }
              } else {
                // Calculate from day number
                dayDate = new Date(today);
                dayDate.setDate(today.getDate() + (dayPlan.day - 1));
              }
              
              if (dayPlan.tasks && Array.isArray(dayPlan.tasks)) {
                dayPlan.tasks.forEach((task: any) => {
                  // Parse labels into proper format
                  let parsedLabels = [];
                  if (task.labels) {
                    parsedLabels = [{ name: task.labels, type: 'category' }];
                  }

                  // Parse subtasks into checklist format
                  let parsedChecklist = [];
                  if (task.subtasks && Array.isArray(task.subtasks)) {
                    parsedChecklist = task.subtasks.map((subtask: string, idx: number) => ({
                      id: idx + 1,
                      text: subtask.trim(),
                      completed: false
                    }));
                  }

                  // Calculate due date based on day plan date
                  let dueDate = dayDate.toISOString();
                  if (task.estimated_minutes) {
                    const due = new Date(dayDate);
                    due.setMinutes(due.getMinutes() + task.estimated_minutes);
                    dueDate = due.toISOString();
                  }

                  // Format date for display
                  const formattedDate = dayDate.toISOString().split('T')[0];

                  // Add day info to description
                  let enhancedDescription = `Day ${dayPlan.day} (${formattedDate}): ${dayPlan.focus}\n\n${task.description || ''}`;
                  
                  // Add module/files info only for development goals
                  if (task.module) {
                    enhancedDescription += `\n\nModule: ${task.module}`;
                  }
                  if (task.files && Array.isArray(task.files) && task.files.length > 0) {
                    enhancedDescription += `\n\nFiles: ${task.files.join(', ')}`;
                  }

                  allTasks.push({
                    board_id: activeBoardId,
                    list_id: listId,
                    goal_id: goalData.id,
                    title: `[Day ${dayPlan.day}] ${task.title}`,
                    description: enhancedDescription,
                    priority: task.priority || 'medium',
                    labels: parsedLabels,
                    assignees: [], // Empty array for AI-generated tasks
                    checklist: parsedChecklist,
                    color: task.color || '#93c5fd',
                    due_date: dueDate,
                    column_status: 'todo',
                    position: globalPosition * 1000,
                    estimated_hours: task.estimated_minutes ? task.estimated_minutes / 60 : null,
                  });
                  
                  globalPosition++;
                });
              }
            });

            if (allTasks.length > 0) {
              await supabase.from('cards').insert(allTasks);
            }
          }
        }

        // Update conversation title to the wish and lock it so the 3rd-message
        // auto-titler (or any later AI titling) never overwrites it.
        if (activeConversationId && parsed.wish) {
          await supabase
            .from('chat_conversations')
            .update({ title: parsed.wish.slice(0, 80), title_locked: true })
            .eq('id', activeConversationId);
        }

        // Strip the XML block from user-facing reply
        reply = reply.replace(/<WOOP_DATA>[\s\S]*?<\/WOOP_DATA>/g, '').trim();
      } catch (err) {
        console.error('Failed to parse or insert WOOP data:', err);
      }
    }

    // ── 5b. Handle GUIDED_QUESTION (mutually exclusive with WOOP_DATA) ──────────
    //
    // The LLM emits this when it decides to run a structured WOOP step instead of
    // plain chat. We parse + validate it, strip it from the visible reply, and
    // surface it as a separate field so the client can open the guided panel.
    // Skipped when WOOP_DATA already fired (finalization takes precedence).
    let guidedQuestion: {
      step: string;
      question: string;
      suggestions: Array<{ text: string; description: string }>;
      placeholder?: string;
    } | null = null;

    if (!goalCreated) {
      const guidedMatch = reply.match(/<GUIDED_QUESTION>([\s\S]*?)<\/GUIDED_QUESTION>/);
      if (guidedMatch) {
        try {
          const parsed = JSON.parse(guidedMatch[1].trim());
          const validSteps = ['wish', 'outcome', 'obstacle', 'plan'];
          if (
            parsed &&
            validSteps.includes(parsed.step) &&
            typeof parsed.question === 'string' &&
            Array.isArray(parsed.suggestions)
          ) {
            // Handle both old string format and new object format
            const processedSuggestions = parsed.suggestions
              .map((s: any) => {
                if (typeof s === 'string') {
                  // Backward compatibility: convert string to object
                  return { text: s, description: '' };
                } else if (s && typeof s === 'object' && s.text) {
                  // New format: use object with text and description
                  return { text: s.text, description: s.description || '' };
                }
                return null;
              })
              .filter((s: any) => s !== null && s.text.trim())
              .slice(0, 4);

            guidedQuestion = {
              step: parsed.step,
              question: parsed.question,
              suggestions: processedSuggestions,
              placeholder: typeof parsed.placeholder === 'string' ? parsed.placeholder : undefined,
            };
          }
          // Strip the block whether or not it parsed cleanly
          reply = reply.replace(/<GUIDED_QUESTION>[\s\S]*?<\/GUIDED_QUESTION>/g, '').trim();
        } catch (err) {
          console.error('Failed to parse guided question:', err);
          reply = reply.replace(/<GUIDED_QUESTION>[\s\S]*?<\/GUIDED_QUESTION>/g, '').trim();
        }
      }
    }

    // ── 6. Persist assistant reply ─────────────────────────────────────────────
    if (activeConversationId) {
      console.log('Persisting assistant reply to conversation:', activeConversationId);
      const { error: replyError } = await supabase.from('chat_messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: reply,
      });

      if (replyError) {
        console.error('Failed to persist assistant reply:', replyError);
      } else {
        console.log('Assistant reply persisted successfully');
      }

      // Bump updated_at on the conversation
      const { error: updateError } = await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversationId);

      if (updateError) {
        console.error('Failed to update conversation timestamp:', updateError);
      } else {
        console.log('Conversation timestamp updated successfully');
      }

      // ── 7. Auto-title once, at the 3rd user message ──────────────────────────
      //
      // Only fires when the title is still unlocked (i.e. neither the user nor
      // the WOOP-wish path has claimed it). Single shot — the helper returning a
      // title locks it, so later messages can't overwrite it.
      const { data: titleTarget } = await supabase
        .from('chat_conversations')
        .select('title_locked')
        .eq('id', activeConversationId)
        .eq('user_id', req.user.id)
        .single();

      if (titleTarget && !titleTarget.title_locked) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', activeConversationId)
          .eq('role', 'user');

        if (count === 3) {
          const newTitle = await generateConversationTitle(activeConversationId);
          if (newTitle) {
            await supabase
              .from('chat_conversations')
              .update({ title: newTitle, title_locked: true })
              .eq('id', activeConversationId)
              .eq('user_id', req.user.id);
          }
        }
      }
    }

    res.json({ response: reply, conversationId: activeConversationId, goalCreated, goal, guidedQuestion });
  } catch (error) {
    console.error('Coaching error:', error);
    res.status(500).json({ error: 'Failed to process coaching' });
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
    console.log('Fetching conversations for user:', req.user.id);
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({ error: error.message });
    }
    console.log('Found conversations:', conversations?.length || 0);
    res.json(conversations || []);
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

    // Lock the title on manual rename so the AI auto-titler never overwrites
    // a user-chosen title afterwards.
    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .update({ title, title_locked: true })
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

    // Verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, title, title_locked')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (convError || !conversation)
      return res.status(404).json({ error: 'Conversation not found' });

    // Respect manual / prior AI titles — never overwrite a locked title.
    if (conversation.title_locked) {
      return res.json({ title: conversation.title, skipped: true, locked: true });
    }

    const newTitle = await generateConversationTitle(id);
    if (newTitle === null) {
      // Too vague, no messages, or Groq failed — leave the title alone.
      return res.json({ title: conversation.title, skipped: true });
    }

    // Save the AI-generated title and lock it against future auto-overwrite.
    const { data: updated, error: updateError } = await supabase
      .from('chat_conversations')
      .update({ title: newTitle, title_locked: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ title: newTitle, conversation: updated });
  } catch (error) {
    console.error('Generate title error:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
});

export default router;
