'use client'

import { createContext, useContext } from 'react'

type FlowPosition = {
  x: number
  y: number
}

type WorkflowContextMenuActions = {
  canAddNode: boolean
  openAddMenuAtClientPosition: (position: FlowPosition) => void
  openAddMenuAtFlowPosition: (position: FlowPosition) => void
}

const WorkflowContextMenuContext =
  createContext<WorkflowContextMenuActions | null>(null)

export const WorkflowContextMenuProvider = WorkflowContextMenuContext.Provider

export function useWorkflowContextMenuActions() {
  return useContext(WorkflowContextMenuContext)
}
