'use client'

import { createContext, useContext } from 'react'

export const DashboardContext = createContext<{
  showReviewColumn: boolean
  setShowReviewColumn: (show: boolean) => void
  showAddTask: boolean
  setShowAddTask: (show: boolean) => void
  authToken: string | null
  setAuthToken: (token: string | null) => void
  boardId: string | null
  setBoardId: (id: string | null) => void
  refreshData: () => Promise<void>
  setRefreshDataFn: (fn: () => Promise<void>) => void
  showColumnField: boolean
  setShowColumnField: (show: boolean) => void
}>({
  showReviewColumn: false,
  setShowReviewColumn: () => {},
  showAddTask: false,
  setShowAddTask: () => {},
  authToken: null,
  setAuthToken: () => {},
  boardId: null,
  setBoardId: () => {},
  refreshData: async () => {},
  setRefreshDataFn: (fn: () => Promise<void>) => {},
  showColumnField: false,
  setShowColumnField: () => {}
})

export const useDashboard = () => useContext(DashboardContext)
