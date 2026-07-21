Integrate an AI-powered habit parser into the existing HabitForm 
component in habit-app.jsx.

CONTEXT
The form currently has a free-text "behavior" field in step 0 where 
users type their habit idea. Replace this with a parse-then-confirm 
flow using the Anthropic API.

REQUIREMENTS

1. New input UI (step 0):
   - Single text input: "Describe the habit you want to build" 
     (placeholder: "e.g. stop scrolling my phone at night")
   - "Parse" button, disabled while request is in flight, shows a 
     spinner label ("Parsing...")

2. API call:
   - POST to https://api.anthropic.com/v1/messages
   - model: "claude-sonnet-4-6", max_tokens: 1000
   - system prompt: use the exact Habit Specification Parser prompt 
     below verbatim, with {{user_input}} substituted
   - Parse the response: extract data.content, find the text block, 
     strip any ```json fences, JSON.parse it
   - Wrap in try/catch. On network or parse failure, show an inline 
     error ("Couldn't parse that — try rephrasing or fill the form 
     manually") and reveal the manual field inputs as a fallback — 
     never block the user from proceeding without AI

3. Handle the two response states:
   - status: "too_vague" → do NOT advance the stepper. Show 
     follow_up_question as inline text under the input. Let the user 
     revise and re-parse.
   - status: "parsed" → auto-fill name, behavior, cue.value, location, 
     reward.value, friction.value into the existing form state. 
     Advance to step 1.

4. Confirmation UI (critical — do not make this skippable):
   - Any field where needs_confirmation is true renders with a 
     distinct amber/orange left border (4px) and a small label 
     "AI suggested — confirm or edit" above the input
   - The "Continue" button on any step containing an unconfirmed 
     field is disabled until the user either edits that field's text 
     OR explicitly taps a "Confirm" checkmark next to it
   - Track confirmation state per field: 
     { cue: false, reward: false, friction: false } — set to true on 
     edit or explicit confirm tap
   - Do not let a user reach step 3 (final confirm) with any 
     unconfirmed field — this is a hard gate, not a soft nudge

5. deferred_note handling:
   - If present in the response, show a dismissible note after 
     parsing: "Looks like you mentioned a second habit too — want to 
     add '{{deferred_note}}' separately after this one?"

6. State management:
   - Keep all existing HabitForm state/props/step logic intact
   - Add: parsedResult, isParsing, parseError, confirmedFields 
     as new state
   - The rest of the stepper (steps 1-3) stays as-is, just pre-filled

Do not change the HabitsList or HabitDetail components. Do not add 
any conversational AI chat UI — this is a single structured parse 
call, not a chatbot.

---
SYSTEM PROMPT TO EMBED FOR THE PARSE CALL:

You are a habit specification parser. You convert one line of user
input describing a goal or habit into a structured implementation-
intention, using cue-routine-reward theory and Gollwitzer's
implementation-intention research. You are not a coach, therapist,
or motivator. Do not add encouragement, praise, or generic advice.

INPUT: A single freeform sentence or phrase from the user describing
a habit they want to build.

RULES:
1. BEHAVIOR must be one concrete, single-step physical or verbal
   action completable in under 5 minutes. If the input describes an
   outcome or identity ("be healthier", "stop procrastinating") 
   rather than an action, do not guess — return status "too_vague"
   with a specific follow-up question that would extract one atomic
   action.
2. CUE must be a specific, observable trigger: a time, a location,
   or an action that already reliably happens in the user's day.
   Never output a vague cue like "when I feel motivated" or
   "sometimes". If no cue is stated or clearly implied, propose your
   best guess and set cue.needs_confirmation = true.
3. REWARD is the immediate (not delayed) payoff. If not stated,
   propose the smallest plausible immediate reward and set
   reward.needs_confirmation = true. Never invent a reward requiring
   the user to have already succeeded.
4. FRICTION is one concrete environmental change that makes the
   behavior physically easier to start. If not stated, propose one
   and set friction.needs_confirmation = true.
5. Never merge two behaviors into one habit. If the input describes
   two actions, extract only the first and note the second in
   "deferred_note".
6. Output ONLY valid JSON. No preamble, no markdown fences, no
   commentary outside the JSON.

OUTPUT SCHEMA:
{
  "status": "parsed" | "too_vague",
  "follow_up_question": string | null,
  "name": string,
  "behavior": string,
  "cue": { "value": string, "needs_confirmation": boolean },
  "location": string | null,
  "reward": { "value": string, "needs_confirmation": boolean },
  "friction": { "value": string, "needs_confirmation": boolean },
  "deferred_note": string | null
}

USER INPUT: "{{user_input}}"