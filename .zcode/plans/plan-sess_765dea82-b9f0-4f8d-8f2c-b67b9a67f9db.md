# Redesign Step 2 (Trigger) with multiple trigger types + time windows

## Goal
Replace the flat 5-option preset list in Step 2 ("Trigger / when this happens") with a **trigger-type selector** that lets the user pick *how* they want to be cued — including a new **time window** (from X time to Y time) — on top of the AI suggestion. Persist the structured trigger to the database.

## Trigger-type model
The user picks one of six types; each renders its own input(s) and feeds a unified `effectiveCue` string + sentence preview:

| `cueType` | Input UI | `effectiveCue` example |
|---|---|---|
| `time` | one `<input type="time">` | "it's 07:00" |
| `window` ⭐ new | two `<input type="time">` (from → to) | "it's between 07:00 and 09:00" |
| `routine` | preset chips (the 4 current ones) + "Custom routine" text | "right after I brush my teeth" |
| `place` | text input (absorbs old location field) | "I'm at my desk" |
| `event` | text input | "I finish work" |
| `custom` | free text (current behaviour) | as-typed |

⭐ = the core new ask. The standalone "Location (optional)" field is removed; its use case is covered by `place`.

## Changes by file

### 1. `packages/db/src/schema.ts` (habits table, ~line 97)
Add three columns after `anchor_id`:
```ts
cue_type: 'text',                      // 'time' | 'window' | 'routine' | 'place' | 'event' | 'custom'
cue_time_start: 'text',                // 'HH:MM' — for time + window
cue_time_end: 'text',                  // 'HH:MM' — for window only
```
`anchor_routine` stays as the readable sentence for backward compat with the "View all habits" tab.

### 2. `apps/backend/supabase-schema-habits.sql`
- Add the three columns to the `CREATE TABLE habits` block (lines ~43-44).
- Add `ALTER TABLE habits ADD COLUMN IF NOT EXISTS cue_type TEXT;` etc. (matching the existing idempotent pattern at lines 61-64) so existing tables get migrated.

### 3. `apps/backend/src/routes/habits.ts`
- **POST** (line 206): destructure `cueType, cueTimeStart, cueTimeEnd` and add them to the `.insert({...})`. Also fix the pre-existing bug: insert `behavior, reward, friction, location` (columns exist but are currently dropped on insert).
- **PUT** (line 261): same destructuring + pass-through for editing.

### 4. `apps/backend/src/routes/ai.ts` — `habitParserSystemPrompt` (lines 1074-1153)
Upgrade the `cue` field in the OUTPUT SCHEMA from `{ value, needs_confirmation }` to:
```json
"cue": {
  "type": "time" | "window" | "routine" | "place" | "event" | "custom",
  "value": string,
  "time_start": "HH:MM" | null,
  "time_end": "HH:MM" | null,
  "needs_confirmation": boolean
}
```
Update rule 2 (CUE) to instruct the model: when the user's phrasing implies a time range ("in the morning", "after work"), prefer `type: "window"` with concrete `time_start`/`time_end`; when it implies a single time ("at 7am"), use `type: "time"`; otherwise map to routine/place/event/custom as today. `value` stays the readable sentence.

### 5. `apps/frontend/app/dashboard/habit/page.tsx`
**New state** (replaces `cue` + `customCue`):
```ts
const [cueType, setCueType] = useState<'routine'|'time'|'window'|'place'|'event'|'custom'>('routine')
const [routinePreset, setRoutinePreset] = useState('')   // matches old CUE_PRESETS minus "Custom trigger"
const [customRoutine, setCustomRoutine] = useState('')   // free text under routine type
const [cueTime, setCueTime] = useState('')               // single time (HH:MM)
const [cueTimeStart, setCueTimeStart] = useState('')     // window start
const [cueTimeEnd, setCueTimeEnd] = useState('')         // window end
const [cuePlace, setCuePlace] = useState('')
const [cueEvent, setCueEvent] = useState('')
const [cueCustom, setCueCustom] = useState('')           // fully free text
```
`location` state is removed (folded into `cuePlace`).

**New `effectiveCue` builder** (replaces line 245) — branches on `cueType`:
- `time` → `it's ${cueTime}`
- `window` → `it's between ${cueTimeStart} and ${cueTimeEnd}`
- `routine` → preset or `customRoutine` lowercased
- `place` → `I'm at ${cuePlace}`
- `event` → `I ${cueEvent}` (e.g. "I finish work")
- `custom` → `cueCustom`

`sentence` (line 246) unchanged except dropping the `${location}` suffix.

**Step 2 UI** (replaces lines 963-1019):
1. Keep the duration-eval banner + label + AI-confirm-label.
2. A **type chip row** (6 chips) — `habit-trigger-type-row` + `habit-trigger-type-chip`. Clicking sets `cueType` and (if AI-parsed) calls `confirmField('cue')`.
3. Below: render only the input(s) for the active `cueType`, wrapped in the existing `habit-ai-confirm-field` box (so the amber→green confirm border still works).
4. Keep the existing "Confirm" pill button.
5. Drop the separate Location field.

**AI mapping** in `handleAiParse` (replaces lines 300-310):
- Read `result.cue.type` (fallback to a heuristic if absent — preserves backward compat with any cached AI responses).
- Set `cueType` accordingly, prefill `cueTime`/`cueTimeStart`/`cueTimeEnd`/routine/etc. from `result.cue.value` + `time_start` + `time_end`.
- Keep the existing `confirmField('cue')` based on `needs_confirmation`.

**`canAdvance` for step 1** (replaces line 351): require the active type's input to be non-empty (e.g. `window` needs both times, `time` needs one time), plus the AI-confirm gate.

**Payload** in `handleCreateHabit` (replaces lines 175-179): send `cueType, cueTimeStart, cueTimeEnd` alongside the existing `anchorRoutine: effectiveCue`. Also send `behavior, reward, friction, location` (they're already in state — the backend change makes them actually persist).

**`resetForm`** (lines 222-225): reset all new cue states to defaults.

### 6. `apps/frontend/styles/_habit.scss`
Add styles near the existing `.habit-option-row` block (~line 1433):
- `.habit-trigger-type-row` — flex-wrap row with 8px gap.
- `.habit-trigger-type-chip` — pill button: `surface-2` bg, `border: 1px solid var(--border)`, 999px radius, 6px 12px padding, `--ink-soft` text; hover lifts to `primary-tint`; `-active` variant uses `primary` border + `primary-dark` text.
- `.habit-time-input-row` — flex row for the two time inputs with a "→" separator between them.

Match the existing aesthetic (same CSS custom properties, same 0.15s transition, same border treatment as `.habit-option-row`).

## Notes / out of scope
- The "View all habits" edit tab reads `anchor_routine` as a plain string — untouched, still works since we keep populating it.
- No changes to `reminder_time` (that's a separate notification concern; the cue window is *when to do the habit*, the reminder is *when to ping*).
- Existing habits (created before this change) have null `cue_type` — treated as `routine` on read.

## Files touched (6)
1. `packages/db/src/schema.ts`
2. `apps/backend/supabase-schema-habits.sql`
3. `apps/backend/src/routes/habits.ts`
4. `apps/backend/src/routes/ai.ts`
5. `apps/frontend/app/dashboard/habit/page.tsx`
6. `apps/frontend/styles/_habit.scss`

## Execution order
1. Schema + SQL (foundations)
2. Backend habits.ts (POST/PUT)
3. Backend ai.ts (prompt + response shape)
4. Frontend state + builder + AI mapping + payload
5. Frontend Step 2 UI
6. SCSS
7. Sanity-check the dev server compiles

## Reminder
After merging, you'll need to run the new `ALTER TABLE` statements against your Supabase instance (the SQL file is idempotent so re-running the whole file works too).