'use client'

import { useState } from 'react'

interface GoalDecompositionResult {
  originalGoal: string
  isConcrete: boolean
  nextAction: {
    title: string
    description: string
    estimatedMinutes: number
    implementationIntention: string
  }
  followUpSteps: Array<{
    title: string
    description: string
    estimatedMinutes: number
  }>
  coachingNote: string
}

interface AIGoalDecomposerProps {
  goalText?: string
  onClose?: () => void
}

export function AIGoalDecomposer({ goalText: initialGoalText, onClose }: AIGoalDecomposerProps) {
  const [goalText, setGoalText] = useState(initialGoalText || '')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GoalDecompositionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDecompose = async () => {
    if (!goalText.trim()) {
      setError('Please enter a goal')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:3001/api/ai/decompose-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText, context: context || undefined })
      })

      if (!response.ok) {
        throw new Error('Failed to decompose goal')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-goal-decomposer">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Goal</label>
          <textarea
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g., Get healthier, Ship the redesign, Learn Spanish..."
            className="w-full p-3 border rounded-lg min-h-[100px] resize-y"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Context (optional)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Any additional context..."
            className="w-full p-3 border rounded-lg"
            disabled={loading}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleDecompose}
            disabled={loading || !goalText.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Decompose Goal'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h3 className="font-semibold text-lg mb-2">Next Action</h3>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium">{result.nextAction.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{result.nextAction.description}</p>
                <p className="text-sm mt-2">
                  <strong>Estimated time:</strong> {result.nextAction.estimatedMinutes} minutes
                </p>
                <p className="text-sm mt-2 text-blue-700">
                  <strong>Implementation intention:</strong> {result.nextAction.implementationIntention}
                </p>
              </div>
            </div>

            {result.followUpSteps.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Follow-up Steps</h3>
                <div className="space-y-2">
                  {result.followUpSteps.map((step, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      <p className="text-xs mt-1">
                        <strong>Time:</strong> {step.estimatedMinutes} minutes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.coachingNote && (
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-sm text-gray-700 italic">{result.coachingNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
