import { memo, useEffect, useRef, useState } from 'react'

import type { CSSProperties } from 'react'
import type { EdgeProps } from 'reactflow'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow'

import { useWorkflowContextMenuActions } from '@/app/components/workflow/workflow-context-menu-context'

const DEFAULT_EDGE_COLOR = '#D0D5DD'
const SELECTED_EDGE_COLOR = '#2970FF'

function CustomEdge({
  id,
  markerEnd,
  selected,
  sourceX,
  sourceY,
  sourcePosition,
  style,
  targetX,
  targetY,
  targetPosition,
}: EdgeProps) {
  const contextMenuActions = useWorkflowContextMenuActions()
  const [isHovered, setIsHovered] = useState(false)
  const hideButtonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.16,
  })
  const edgeColor = selected
    ? SELECTED_EDGE_COLOR
    : (style?.stroke ?? DEFAULT_EDGE_COLOR)
  const edgeStyle: CSSProperties = {
    ...style,
    stroke: edgeColor,
    strokeWidth: style?.strokeWidth ?? 2,
    strokeDasharray: '8 8',
  }
  const showAddButton = isHovered && contextMenuActions?.canAddNode

  const showButton = () => {
    if (hideButtonTimeout.current) {
      clearTimeout(hideButtonTimeout.current)
    }
    setIsHovered(true)
  }

  const hideButton = () => {
    hideButtonTimeout.current = setTimeout(() => setIsHovered(false), 100)
  }

  useEffect(
    () => () => {
      if (hideButtonTimeout.current) {
        clearTimeout(hideButtonTimeout.current)
      }
    },
    [],
  )

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={edgeStyle}
        interactionWidth={20}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={showButton}
        onMouseLeave={hideButton}
      />

      <EdgeLabelRenderer>
        <button
          aria-label="Add node"
          className={`nodrag nopan flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition-all hover:bg-blue-700 ${
            showAddButton
              ? 'pointer-events-auto scale-100 opacity-100'
              : 'pointer-events-none scale-75 opacity-0'
          }`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          type="button"
          onMouseEnter={showButton}
          onMouseLeave={hideButton}
          onClick={event => {
            event.stopPropagation()
            contextMenuActions?.openAddMenuAtFlowPosition({
              x: labelX,
              y: labelY,
            })
          }}
        >
          <span className="pointer-events-none text-3xl leading-none">+</span>
        </button>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(CustomEdge)
