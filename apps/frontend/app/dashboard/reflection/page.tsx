'use client'

import React, { useState } from 'react'
import { useWeeklyReviewData } from './hooks/useWeeklyReviewData'
import { WeeklyReviewStepper } from './components/weekly-review-stepper'
import { Step1GetClear } from './components/steps/step1-get-clear'
import { Step2GetCurrent } from './components/steps/step2-get-current'
import { Step3GoalAlignment } from './components/steps/step3-goal-alignment'
import { Step4GetCreative } from './components/steps/step4-get-creative'
import { Step5CommitmentSummary } from './components/steps/step5-commitment-summary'
import { ReflectionHistoryModal } from './components/reflection-history-modal'

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="wr-page">
      <div className="wr-loading-page">
        <div className="wr-loading-page__header">
          <div className="wr-loading-page__title-row">
            <div className="wr-skeleton wr-skeleton--title" style={{ width: '40%' }} />
            <div className="wr-skeleton wr-skeleton--text" style={{ width: '120px' }} />
          </div>
          <div className="wr-skeleton wr-skeleton--text" style={{ width: '100%', height: 6 }} />
          <div className="wr-loading-page__pills">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="wr-skeleton wr-skeleton--pill" />
            ))}
          </div>
        </div>
        <div className="wr-loading-page__body">
          <div className="wr-loading-page__card">
            <div className="wr-skeleton wr-skeleton--title" style={{ width: '60%' }} />
            <div className="wr-skeleton wr-skeleton--block" />
            <div className="wr-skeleton wr-skeleton--block" />
            <div className="wr-skeleton wr-skeleton--block" />
          </div>
          <div className="wr-loading-page__card">
            <div className="wr-skeleton wr-skeleton--title" style={{ width: '50%' }} />
            <div className="wr-skeleton wr-skeleton--card" />
            <div className="wr-skeleton wr-skeleton--card" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="wr-page">
      <div className="wr-error-page">
        <div className="wr-error-page__icon">⚠️</div>
        <h2 className="wr-error-page__title">Couldn&apos;t load your Weekly Review</h2>
        <p className="wr-error-page__body">{message}</p>
        <button className="wr-btn wr-btn--primary wr-btn--lg" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReflectionPage() {
  const [currentStep,    setCurrentStep]    = useState<number>(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isHistoryOpen,  setIsHistoryOpen]  = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const data = useWeeklyReviewData()

  // ── Loading / Error guards ────────────────────────────────────────────────
  if (data.isLoading) return <LoadingSkeleton />
  if (data.error)     return <ErrorState message={data.error} />

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true)
    await data.handleFetchHistory()
  }

  const handleFinish = async () => {
    const ok = await data.handleFinishReview()
    if (ok !== false) setShowCelebration(true)
  }

  return (
    <div className="wr-page">
      <div className="wr-container">

        {/* ── Stepper Header ────────────────────────────────────────── */}
        <WeeklyReviewStepper
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          completedSteps={completedSteps}
          lastSavedAt={data.lastSavedAt}
          isAutoSaving={data.isAutoSaving}
          onOpenHistory={handleOpenHistory}
        />

        {/* ── Step Views ────────────────────────────────────────────── */}
        <main>
          {currentStep === 1 && (
            <Step1GetClear
              inboxItems={data.inboxItems}
              setInboxItems={data.setInboxItems}
              workspaceChecklist={data.workspaceChecklist}
              setWorkspaceChecklist={data.setWorkspaceChecklist}
              onNextStep={handleNextStep}
            />
          )}

          {currentStep === 2 && (
            <Step2GetCurrent
              habits={data.habits}
              rolloverTasks={data.rolloverTasks}
              setRolloverTasks={data.setRolloverTasks}
              energyLevel={data.energyLevel}
              setEnergyLevel={data.setEnergyLevel}
              stressLevel={data.stressLevel}
              setStressLevel={data.setStressLevel}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3GoalAlignment
              goals={data.goals}
              setGoals={data.setGoals}
              woopObstacle={data.woopObstacle}
              setWoopObstacle={data.setWoopObstacle}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4GetCreative
              workedWell={data.workedWell}
              setWorkedWell={data.setWorkedWell}
              didntWork={data.didntWork}
              setDidntWork={data.setDidntWork}
              intention={data.intention}
              setIntention={data.setIntention}
              aiInsights={data.aiInsights}
              setAiInsights={data.setAiInsights}
              isGeneratingAi={data.isGeneratingAi}
              onGenerateAi={data.handleGenerateAi}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
            />
          )}

          {currentStep === 5 && (
            <Step5CommitmentSummary
              topPriorities={data.topPriorities}
              setTopPriorities={data.setTopPriorities}
              weeklyMotto={data.weeklyMotto}
              setWeeklyMotto={data.setWeeklyMotto}
              intention={data.intention}
              energyLevel={data.energyLevel}
              isSaving={data.isSaving}
              onFinishReview={handleFinish}
              onPrevStep={handlePrevStep}
            />
          )}
        </main>
      </div>

      {/* ── History Modal ─────────────────────────────────────────── */}
      <ReflectionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reflections={data.pastReflections}
        isLoading={data.isLoadingHistory}
      />

      {/* ── Celebration Modal ─────────────────────────────────────── */}
      {showCelebration && (
        <div className="wr-celebration-overlay">
          <div className="wr-celebration">
            <div className="wr-celebration__icon">🎉</div>
            <h2 className="wr-celebration__title">Weekly Review Sealed!</h2>
            <p className="wr-celebration__body">
              Your habits, goals, and implementation intentions are saved and synced. Start next week with full clarity!
            </p>
            <button
              className="wr-btn wr-btn--success wr-btn--lg wr-celebration__cta"
              onClick={() => {
                setShowCelebration(false)
                setCurrentStep(1)
                setCompletedSteps([])
              }}
            >
              Done — Return to Step 1
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
