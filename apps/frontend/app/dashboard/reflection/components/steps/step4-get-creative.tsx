'use client'

import React from 'react'

export interface ImplementationIntention {
  trigger: string
  action: string
  location: string
}

interface Step4Props {
  workedWell: string
  setWorkedWell: (val: string) => void
  didntWork: string
  setDidntWork: (val: string) => void
  intention: ImplementationIntention
  setIntention: React.Dispatch<React.SetStateAction<ImplementationIntention>>
  aiInsights: string | null
  setAiInsights: (insights: string | null) => void
  isGeneratingAi: boolean
  onGenerateAi: () => void
  onNextStep: () => void
  onPrevStep: () => void
}

export function Step4GetCreative({
  workedWell,
  setWorkedWell,
  didntWork,
  setDidntWork,
  intention,
  setIntention,
  aiInsights,
  setAiInsights,
  isGeneratingAi,
  onGenerateAi,
  onNextStep,
  onPrevStep
}: Step4Props) {
  return (
    <div className="wr-step">
      {/* Evidence Banner */}
      <div className="wr-evidence">
        <div className="wr-evidence__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <div className="wr-evidence__title">Evidence Rationale: Implementation Intentions</div>
          <p className="wr-evidence__body">
            <strong>Gollwitzer&apos;s</strong> meta-analyses demonstrate that &quot;If-Then&quot; plans linking a specific trigger to a concrete action increase goal execution rates by over <strong>2×</strong>. AI coaching surfaces patterns invisible to manual reflection.
          </p>
        </div>
      </div>

      {/* AI Coach Panel */}
      <div className="wr-ai-coach">
        <div className="wr-ai-coach__body">
          <div className="wr-ai-coach__chips">
            <span className="wr-ai-coach__chip">AI Behavioral Coach</span>
            <span className="wr-ai-coach__chip-label">Weekly Insights & Tweak Analysis</span>
          </div>
          <p className="wr-ai-coach__desc">
            Let AI analyze your habit stats, rollover tasks, and energy levels to recommend 1 high-leverage behavioral adjustment.
          </p>
        </div>
        <div className="wr-ai-coach__cta">
          <button
            className="wr-btn wr-btn--ai wr-btn--md"
            onClick={onGenerateAi}
            disabled={isGeneratingAi}
          >
            {isGeneratingAi ? (
              <>
                <svg className="wr-spinner wr-icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Analyzing Week...
              </>
            ) : (
              <>
                <svg className="wr-icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate AI Weekly Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Insights Output Box */}
      {aiInsights && (
        <div className="wr-ai-insights">
          <div className="wr-ai-insights__header">
            <span className="wr-ai-insights__label">✨ AI Behavioral Diagnosis</span>
            <button className="wr-ai-insights__dismiss" onClick={() => setAiInsights(null)}>Dismiss</button>
          </div>
          <p className="wr-ai-insights__body">{aiInsights}</p>
        </div>
      )}

      {/* Guided Reflection Prompts */}
      <div className="wr-reflection-pair">
        <div className="wr-reflection-card">
          <div className="wr-reflection-card__title wr-reflection-card__title--success">
            🎉 What worked exceptionally well?
          </div>
          <p className="wr-reflection-card__desc">
            Identify successful routines, positive surprises, or habit highlights to replicate next week.
          </p>
          <textarea
            className="wr-textarea wr-textarea--success"
            value={workedWell}
            onChange={(e) => setWorkedWell(e.target.value)}
            placeholder="E.g., Morning workout habit felt effortless because I laid out gym clothes the night before..."
            rows={4}
          />
        </div>

        <div className="wr-reflection-card">
          <div className="wr-reflection-card__title wr-reflection-card__title--accent">
            ⚡ Where did friction or missed expectations occur?
          </div>
          <p className="wr-reflection-card__desc">
            Frame obstacles with curiosity rather than self-blame. What trigger caused the friction?
          </p>
          <textarea
            className="wr-textarea wr-textarea--accent"
            value={didntWork}
            onChange={(e) => setDidntWork(e.target.value)}
            placeholder="E.g., Skipped reading on Wednesday because I left my phone next to my bed..."
            rows={4}
          />
        </div>
      </div>

      {/* Implementation Intention Builder */}
      <div className="wr-intention">
        <div className="wr-intention__header">
          <h2 className="wr-intention__title">&quot;If-Then&quot; Implementation Intention Builder</h2>
          <p className="wr-intention__desc">
            Formulate 1 concrete micro-adjustment for next week using specific trigger-action logic.
          </p>
        </div>

        <div className="wr-intention__fields">
          <div>
            <div className="wr-intention__field-label wr-intention__field-label--when">1. WHEN [Trigger Context]</div>
            <input
              type="text"
              className="wr-input"
              value={intention.trigger}
              onChange={(e) => setIntention({ ...intention, trigger: e.target.value })}
              placeholder="e.g. I finish my morning coffee"
            />
          </div>
          <div>
            <div className="wr-intention__field-label wr-intention__field-label--will">2. I WILL [Specific Action]</div>
            <input
              type="text"
              className="wr-input wr-input--success"
              value={intention.action}
              onChange={(e) => setIntention({ ...intention, action: e.target.value })}
              placeholder="e.g. write down my 3 daily priority tasks"
            />
          </div>
          <div>
            <div className="wr-intention__field-label wr-intention__field-label--at">3. AT / IN [Location]</div>
            <input
              type="text"
              className="wr-input wr-input--accent"
              value={intention.location}
              onChange={(e) => setIntention({ ...intention, location: e.target.value })}
              placeholder="e.g. my desk before opening email"
            />
          </div>
        </div>

        {intention.trigger && intention.action && (
          <div className="wr-intention__preview">
            <span className="wr-intention__preview-label">Commitment:</span>
            <span>
              &quot;WHEN <strong>{intention.trigger}</strong>, I WILL <strong>{intention.action}</strong> AT/IN <strong>{intention.location || 'my workspace'}</strong>.&quot;
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wr-nav">
        <button className="wr-btn wr-btn--ghost wr-btn--md" onClick={onPrevStep}>← Back</button>
        <button className="wr-btn wr-btn--primary wr-btn--lg" onClick={onNextStep}>
          Continue to Step 5: Commitment Card
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
