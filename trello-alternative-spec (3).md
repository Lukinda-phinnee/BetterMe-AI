# BetterMe (working name) — Product & Technical Specification
### An AI growth engine for tasks, routines, and habits — for one person or a whole company

*Prepared: July 2026 — v2: pivots the core value proposition from "task platform with an AI add-on" to "AI that makes you (or your team) better at follow-through," built on the same task/board substrate as before.*

---

## 0. The pivot, in one paragraph

Version 1 of this doc treated the AI as a smart assistant sitting on top of a Trello-style board. That's still true here, but the **center of gravity moves**: the product is no longer "a task manager that happens to have AI," it's **an AI that helps someone follow through on tasks and routines**, and the board/list/calendar views are the *substrate* it operates on, not the star of the show. This matters architecturally too — the behavior-change logic (§3) becomes a core service the rest of the app is built around, not a bolt-on module.

---

## 1. Why build this (positioning)

Trello's core weaknesses that a new product should fix, based on well-documented, evidence-backed project-management research rather than opinion:

| Problem with pure Trello-style boards | Research/Principle behind the fix |
|---|---|
| Unlimited WIP (work-in-progress) per column encourages multitasking, which measurably increases completion time | **Little's Law** (queueing theory: Lead Time = WIP ÷ Throughput) and the Kanban Method's core practice of **WIP limits**, both central to Lean/Kanban literature (Anderson, *Kanban*, 2010) |
| Cards give no sense of urgency vs. importance | **Eisenhower Matrix** (urgent/important quadrants) — a well-established prioritization heuristic |
| No time-boxing, so tasks expand to fill available time | **Parkinson's Law** ("work expands to fill the time available") — argues for built-in due dates/time estimates, not just checklists |
| No structured capture-to-action pipeline | **GTD (Getting Things Done, David Allen)** — Inbox → Clarify → Organize → Reflect → Engage. A "personal life" tool benefits from an Inbox/Someday-Maybe list, not just static columns |
| One board type forced onto every workflow | **Cynefin/contextual fit** — simple checklist work (personal) and complex multi-team work (org) need different views (list, board, calendar, timeline/Gantt) over the *same* underlying data model |
| No feedback loop on how work actually flows | **Cycle-time/cumulative-flow analytics** used in Kanban/Scrum retrospectives — surfacing bottlenecks empirically instead of guessing |

**Conclusion:** the app should keep Trello's simplicity as the *default* surface, but store data in a way that supports multiple views (List / Board / Calendar / Timeline) and enforce optional, research-backed guardrails (WIP limits, priority tagging, cycle-time metrics) that Trello leaves out.

---

## 2. Core feature set

### 2.1 Universal (personal + org)
- **Workspaces → Projects → Boards → Lists → Cards** hierarchy (multi-tenant from day one)
- Multiple views over one data model: Kanban board, List/table, Calendar, Timeline/Gantt, "My Day" personal view
- Cards: title, description (rich text), checklist, due date + reminder, attachments, labels/tags, assignees, priority (Eisenhower quadrant), estimated vs. actual time, comments, activity log
- **WIP limits per column** (soft warning, not a hard block) — configurable per board
- Recurring cards/tasks (for personal habits/chores as well as recurring org work)
- Global "Inbox" for quick capture (GTD-style), triaged later into projects
- Search & filters (assignee, label, due date, priority) with saved filter views
- Notifications: in-app, email, and push, batched to avoid interruption overload
- Offline support with automatic conflict-free sync on reconnect
- Keyboard-first navigation (command palette, à la Linear/Superhuman) for power users
- Dark/light themes, accessible color contrast (WCAG 2.2 AA)

### 2.2 Personal-life mode
- "Someday/Maybe" list and GTD-style weekly review prompt
- Habit/recurring task streaks
- Simple budgeting/shopping-list card type (checklist + quantity fields)
- Personal analytics: "time spent by label" (e.g., health, finance, family)

### 2.3 Organization mode
- Roles & permissions (Owner/Admin/Member/Guest), per-project overrides
- Team capacity view (who's overloaded, based on WIP + estimated hours)
- Cross-project dependency links ("blocked by/blocking")
- Cycle-time & cumulative-flow-diagram analytics per board (data-driven bottleneck detection)
- Automation/rules engine ("when card moves to Done, notify X, archive after 30 days") — Zapier-style, but built in and modular
- Audit log & data export (GDPR-friendly)
- SSO (SAML/OIDC) and SCIM provisioning for enterprise use
- API + webhooks so it can be an integration hub, not a silo
- Guest/external collaborator access scoped to a single board

### 2.4 Differentiators vs. Trello
- Native multi-view (board isn't the only lens on the data)
- Built-in WIP limits + cycle-time analytics (Trello needs Power-Ups for this)
- One product that flexes between "personal todo app" and "team project tool" instead of forcing team-oriented UX onto solo use
- Plugin/module architecture (see §4) so features are opt-in, not bloat

---

## 3. The Growth Engine — the AI that makes you (or your team) better

This is now the core of the product, not a bolt-on. It's grounded in established behavior-change science rather than generic "AI assistant" framing, because the honest research on habit/task follow-through says the failure mode is almost never "the user didn't know what to do" — it's motivation, ability, or timing.

### 3.1 The behavioral model behind it: B = MAP

The engine is organized around Stanford researcher BJ Fogg's **Fogg Behavior Model (B = MAP)**: a behavior happens only when **Motivation**, **Ability**, and a **Prompt** converge at the same moment — if any one is too weak, the behavior doesn't happen, no matter how strong the other two are. This reframes almost every feature below:

| Failure mode | What it looks like | Engine's response |
|---|---|---|
| Low **Motivation** | User knows the task matters but can't feel it right now | Identity/value-linked framing, autonomy-supportive language (§3.3), progress visualization tied to the user's own stated "why" |
| Low **Ability** | Task feels too big, vague, or effortful | AI decomposes vague goals into the smallest next action ("Tiny Habits" principle — shrink the behavior instead of relying on willpower) |
| Missing/mistimed **Prompt** | Right task, wrong moment — reminder fires when the user has no ability or motivation to act | Context-aware nudges anchored to existing routines ("habit stacking": *after* an action you already do, not at an arbitrary clock time) |

### 3.2 Concrete engine behaviors

| Capability | What it does | Grounded in |
|---|---|---|
| **Goal → next-action decomposition** | Turns "get healthier" or "ship the redesign" into the single smallest next step, then a short chain of follow-on steps | Fogg's Tiny Habits (shrink the behavior); implementation intentions (Gollwitzer, 1999) — "if situation X, then I will do Y" is measurably more effective than a vague intention |
| **WOOP-style goal setting** | For bigger goals, the AI walks the user through **W**ish, **O**utcome, **O**bstacle, **P**lan instead of a bare to-do — naming the realistic obstacle up front, not just the wish | Oettingen's "mental contrasting" research, which found that pairing a positive outcome with a concrete obstacle outperforms pure positive-thinking goal-setting |
| **Habit-stacked reminders** | New routines get anchored to an existing one the user already reports doing reliably ("after coffee, review your 3 priorities") rather than a generic push notification at 8am | Habit-stacking / cue consistency research popularized by *Atomic Habits* (Clear) and consistent with Fogg's "anchor moment" |
| **Autonomy-supportive coaching tone (not guilt)** | Nudges are framed as the user's own choice and reasoning, never shame or streak-loss guilt ("you skipped 2 days" vs. "want to pick this back up today?") | Self-Determination Theory (Deci & Ryan) — autonomy-supportive motivation produces more durable behavior change than controlling/pressure-based motivation, which tends to produce short-term compliance and long-term drop-off |
| **Realistic estimates from your own history** | Due-date and time-estimate suggestions are pulled from the user's own past completion data, not generic guesses | Removes the classic planning-fallacy gap between intended and actual time |
| **Weekly reflection loop** | A short, structured review: what got done, what didn't, why (no diagnosis, just the user's own words), what's the one adjustment for next week | GTD's weekly review; behavior-change literature broadly treats regular self-monitoring/reflection as one of the more consistently supported components of successful habit interventions |
| **Org "manager" mode** | Same engine, aimed at team execution: standup digests, blocked-work flags, workload-balance suggestions, drafted stakeholder updates | Kanban cycle-time/cumulative-flow data (§2.3) — same underlying event log, different audience |

### 3.3 Ethical guardrails (non-negotiable)

The same Fogg model that makes behavior-change products effective is also what makes dark patterns effective — guilt-based streak-loss messaging, manipulative urgency, and engagement-for-its-own-sake are well-documented in the persuasive-technology literature as effective *and* harmful to user wellbeing. This product deliberately avoids that path:
- No guilt/shame-based copy ("you failed your streak") — reframe as "pick back up," never as loss.
- No dark-pattern urgency (fake scarcity, manufactured streak-anxiety, infinite-scroll-style engagement loops).
- Nudge frequency is user-controlled, with sensible low-pressure defaults — the product optimizes for the user's actual follow-through and wellbeing, not for time-in-app.
- The AI **never diagnoses** ("this looks like burnout/ADHD") — it reflects patterns in the user's own data and asks what they'd like to do about it, and suggests professional support only in the ordinary, non-clinical sense of "if this is a heavier struggle, a coach/therapist might help."

### 3.4 Personal vs. org framing of the same engine

| | Personal mode | Org mode |
|---|---|---|
| What it's optimizing for | The user's own stated goals/values | Team throughput + individual workload health |
| Tone | Coach — warm, autonomy-supportive, identity-linked | Chief-of-staff — concise, factual, still non-punitive |
| Data it reasons over | Personal task/habit history, weekly reflections | Team event log, cycle-time, capacity data |
| Sensitive capability | Habit-stacking/goal-setting features | Workload-rebalancing suggestions (ships last, opt-in, admin-only — §3.6) |

### 3.5 Architecture for it

| Piece | Recommendation | Notes |
|---|---|---|
| **Agent layer** | Dedicated `/agents` directory inside `apps/web` (or its own `apps/agent-service` as load grows) with prompts, tool definitions, and streaming route handlers kept separate from regular routes | Mirrors the emerging 2026 Next.js convention of isolating LLM integration so prompt/tool changes don't ripple through unrelated code |
| **Model access** | Vercel AI SDK (`ai` package) with a swappable provider (`@ai-sdk/anthropic`, `@ai-sdk/openai`) | Avoids vendor lock-in for a long-lived product |
| **Behavioral state store** | A `behavior_profile` table per user: stated goals/values, reliable anchor routines (for habit-stacking), preferred nudge tone/frequency, WOOP entries | This is the thing that used to be an afterthought ("ai_preferences") and is now core schema — the engine's quality depends on it |
| **Tools exposed to the model** | `getOverdueCards`, `getCycleTimeStats`, `getUserWorkload`, `decomposeGoal(goalText)`, `suggestAnchorPrompt(userId)`, `draftWOOP(goalText)`, `summarizeThread(cardId)` — typed functions, not raw DB access | Keeps the model constrained to safe, auditable operations |
| **Context/RAG** | Direct SQL over cards/comments/event log/behavior_profile, scoped to the requesting user/workspace; pgvector added later only for semantic search over long text history | No need for a heavier RAG stack before it's justified |
| **Cost/latency control** | Scheduled jobs (digests, weekly reviews) use smaller/cheaper models by default; interactive coaching chat can use a stronger model on demand | Keeps background AI usage affordable at scale |
| **Privacy boundary** | Org-tier data respects workspace isolation — no cross-workspace context in a single prompt; personal behavior_profile data never shared with an org account without explicit action | Non-negotiable for both the personal-trust and enterprise use cases |

### 3.6 Rollout order for this engine
1. **Reactive core**: natural-language search/summarization + AI goal decomposition (turn a vague card into a next action) — lowest risk, immediate value, personal and org both benefit.
2. **Structured goal-setting**: WOOP flow for bigger goals, habit-stacked reminder setup, realistic due-date suggestions from history.
3. **Proactive loop**: scheduled weekly reflection prompts (personal) and team digests (org), autonomy-supportive nudge copy live end-to-end.
4. **Sensitive/organizational**: workload-rebalancing suggestions — ships last, fully opt-in, admin-visible only, because it touches people-management dynamics directly.

---

## 4. High-level architecture principles (why "modular")


1. **Modular monolith → microservices-ready**: start as a modular monolith (clear internal module boundaries, one deployable) and only split into services when a specific module (e.g., notifications, automations) genuinely needs independent scaling. This avoids premature microservice complexity while keeping the *option* open.
2. **Plugin/module system**: each feature (automations, calendar view, time-tracking, Gantt) is a self-contained module with its own routes, DB migrations, and UI components, registered through a manifest — so features can be toggled per workspace (personal users don't need SSO/SCIM; orgs don't need habit streaks).
3. **API-first**: the web/mobile clients consume the same public API that third-party integrations use. No hidden internal-only endpoints.
4. **Separation of read/write models for analytics**: cycle-time and cumulative-flow analytics are computed from an event log (card moved, created, completed), not by mutating the primary card table — enables adding new analytics later without touching core schema.

---

## 5. Recommended tech stack

Grounded in current (2026) production-proven choices for a TypeScript full-stack, real-time collaborative product:

| Layer | Recommendation | Rationale |
|---|---|---|
| **Frontend framework** | **Next.js 15/16 (App Router)** + TypeScript (strict mode) | The dominant full-stack React framework, combining SSR/SSG, Server Components, and Server Actions in one framework, which simplifies the modular-monolith approach described above |
| **UI/styling** | Tailwind CSS + shadcn/ui (Radix primitives) | Accessible, composable, copy-paste components — easy to keep each "module" visually consistent without a heavy design-system build |
| **State/data-fetching (client)** | TanStack Query (React Query) + Zustand for local UI state | Keeps server state and UI state cleanly separated — important for a board with heavy real-time updates |
| **Backend runtime** | **Node.js** (within Next.js Route Handlers/Server Actions for CRUD) + a **dedicated Node/NestJS service** for real-time, automations, and webhooks | Keeps simple CRUD colocated with the frontend for velocity, while isolating stateful/real-time workloads that need independent scaling — this is the seam where "modular monolith → microservices" happens first |
| **API layer** | tRPC internally (type-safe, zero-boilerplate) + a public **REST/GraphQL API** for third-party integrations | tRPC gives end-to-end type safety from DB to UI for internal modules; a separate public API keeps the integration surface stable and versioned independently of internal refactors |
| **Database** | **PostgreSQL** (primary system of record) | Relational integrity for workspaces/projects/permissions; mature, battle-tested, supports JSONB for flexible card metadata without needing a second database |
| **ORM** | **Drizzle** or Prisma | Drizzle for performance/edge-compatibility; Prisma for developer experience and migration tooling — pick one per team preference, both are current, well-supported choices |
| **Real-time sync (board updates, multi-cursor)** | **WebSockets** (e.g., via a service like Soketi/Socket.IO or a managed provider) for presence/broadcast, plus **CRDTs (Yjs)** for any freeform collaborative fields (rich-text descriptions, comments) | For structured card moves/edits, a coordinated server (WebSocket + optimistic UI + last-write-wins with field-level granularity) is simpler and sufficient; CRDTs are reserved specifically for concurrent free-text editing, where <cite index="10-1">Figma itself moved from OT to CRDTs in 2019 specifically to support offline-first, conflict-free collaborative editing</cite>. This is a case where using the heavier tool (CRDT) only where its offline/merge guarantees are actually needed keeps the system simpler everywhere else. |
| **Background jobs / automations** | BullMQ (Redis-backed queue) | Automation rules ("move card → notify"), recurring task generation, and email digests all need durable, retryable job processing separate from the request/response cycle |
| **Cache / pub-sub** | Redis | Session cache, WebSocket pub-sub fan-out across server instances, rate limiting |
| **Auth** | Auth.js (NextAuth) for personal use; **OIDC/SAML via a dedicated identity module** for org/enterprise tier | Matches the personal-vs-org split: lightweight auth for individuals, standards-based SSO for teams |
| **File storage** | S3-compatible object storage (AWS S3, Cloudflare R2, or MinIO self-hosted) | Attachments, avatars — decoupled from the primary DB |
| **Search** | Postgres full-text search initially; move to **Meilisearch/Typesense** if search volume/complexity grows | Avoids operating a separate search cluster (Elasticsearch) until it's actually justified |
| **Mobile** | React Native (Expo) reusing the TypeScript domain/business logic | Shares types and validation logic with the web app instead of a second implementation |
| **Testing** | Vitest (unit), Playwright (E2E) | Current standard pairing for Next.js projects |
| **CI/CD** | GitHub Actions | Free tier is generous, native integration with the ecosystem |
| **Infra/deploy** | Vercel (frontend + Server Actions) + a container platform (Fly.io/Railway/AWS ECS) for the real-time/worker service | Lets the two different workload types (stateless web vs. stateful real-time/queues) scale independently |
| **Observability** | OpenTelemetry + Sentry (errors) + a metrics dashboard (Grafana/Prometheus or a hosted equivalent) | Needed early to actually measure the cycle-time/analytics features you're promising users |

### Why not a single "batteries-included" framework (e.g., Wasp, Rails, Laravel)?
Those frameworks trade flexibility for speed, which is a fine choice for a solo MVP, but conflicts with the "very modular" requirement — a strongly-opinionated full-stack framework makes it harder to later split out the real-time/automation service or swap individual modules. Next.js + a companion Node service gives most of the productivity benefits (type-safety end-to-end, one language) while preserving the seam needed for modularity.

---

## 6. Suggested repo/module structure (monorepo)

```
flowboard/
├── apps/
│   ├── web/              # Next.js app (App Router) — UI + Server Actions for CRUD
│   ├── realtime/         # Node/NestJS service — WebSocket presence, board sync
│   ├── worker/           # BullMQ job processor — automations, recurring tasks, emails, AI digests
│   └── mobile/           # React Native (Expo)
├── apps/web/agents/       # AI Coach/Manager: prompts, tool defs, streaming routes (see §3)
├── packages/
│   ├── core/             # domain types, validation (zod schemas), shared business logic
│   ├── db/                # Drizzle/Prisma schema + migrations (single source of truth)
│   ├── api-client/       # generated typed client for public REST/GraphQL API
│   ├── ui/                # shared design-system components (shadcn-based)
│   └── modules/
│       ├── board-view/
│       ├── calendar-view/
│       ├── timeline-view/
│       ├── automations/
│       ├── analytics-cycle-time/
│       ├── ai-coach-manager/   # Growth Engine: tool-calling, behavior_profile, WOOP/decomposition (see §3)
│       ├── time-tracking/
│       ├── sso-scim/          # org-tier only, feature-flagged
│       └── habit-tracking/    # personal-tier only, feature-flagged
└── turbo.json / pnpm-workspace.yaml
```

Each item under `packages/modules/*` exports a manifest (routes, nav entry, DB migration set, feature flag key) so a workspace can enable exactly the modules it needs — this is the concrete mechanism behind "modular" rather than just a marketing word.

---

## 7. Suggested build order (MVP → V1 → V2)

1. **MVP**: Workspaces/Projects/Boards/Cards, single Kanban view, WIP limits, auth (personal tier only), basic notifications.
2. **V1**: List/Calendar views over the same data, recurring tasks, Inbox/GTD capture, mobile app, automations module, **AI step 1–2** (natural-language search, card summarization, draft-and-approve checklists/due dates — §3.4).
3. **V2**: Org tier — roles/permissions, SSO/SCIM, cross-project dependencies, cycle-time analytics, public API + webhooks, timeline/Gantt view, **AI step 3–4** (proactive coach/manager digests, workload-rebalancing suggestions).

---

## 8. Key sources consulted
- Anderson, D. — *Kanban: Successful Evolutionary Change for Your Technology Business* (WIP limits, Little's Law)
- Allen, D. — *Getting Things Done* (capture/clarify/organize workflow, weekly review)
- Fogg, BJ — *Tiny Habits* / Fogg Behavior Model (B=MAP): Motivation, Ability, Prompt (behaviormodel.org)
- Gollwitzer, P. — implementation intentions research ("if-then" planning outperforms vague goals)
- Oettingen, G. — WOOP / mental contrasting research (Wish, Outcome, Obstacle, Plan)
- Deci, E. & Ryan, R. — Self-Determination Theory (autonomy-supportive vs. controlling motivation)
- Clear, J. — *Atomic Habits* (habit stacking, cue design)
- Groovy Web, *Next.js 15 Project Structure: Full-Stack Guide* (2026) — `/agents` directory pattern for LLM integration
- Wasp, *Best Full-stack Web App Frameworks in 2026*
- SoftwareMill, *Modern Full Stack Application Architecture Using Next.js 15+*
- Strapi, *5 Best Next.js Templates in 2026* (T3 stack, Drizzle/Prisma comparison)
- Zylos Research / Calmops — CRDT vs. OT production trade-offs, 2026
