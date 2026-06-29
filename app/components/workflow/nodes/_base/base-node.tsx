'use client'

import { useEffect, useRef, useState } from 'react'

import type { CSSProperties, ReactNode } from 'react'
import { Handle, Position } from 'reactflow'

import type { WorkflowNodeRunStatus } from '@/app/components/workflow/nodes/_base/workflow-node-data'
import { useWorkflowContextMenuActions } from '@/app/components/workflow/workflow-context-menu-context'

type NodeTone = 'zinc' | 'indigo' | 'emerald' | 'amber'

type BaseNodeProps = {
  title: string
  tone?: NodeTone
  children?: ReactNode
  hasTarget?: boolean
  hasSource?: boolean
  minWidthClassName?: string
  runStatus?: WorkflowNodeRunStatus
}

const toneClassMap: Record<
  NodeTone,
  {
    border: string
    headerBg: string
    title: string
    handle: string
  }
> = {
  zinc: {
    border: 'border-zinc-200',
    headerBg: 'bg-zinc-50',
    title: 'text-zinc-900',
    handle: 'bg-zinc-600!',
  },
  indigo: {
    border: 'border-indigo-200',
    headerBg: 'bg-indigo-50',
    title: 'text-indigo-900',
    handle: 'bg-indigo-600!',
  },
  emerald: {
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    title: 'text-emerald-900',
    handle: 'bg-emerald-600!',
  },
  amber: {
    border: 'border-amber-200',
    headerBg: 'bg-amber-50',
    title: 'text-amber-900',
    handle: 'bg-amber-500!',
  },
}

type HandleWithAddButtonProps = {
  type: 'source' | 'target'
  position: Position.Left | Position.Right
  className: string
}

const handleLineStyle: CSSProperties = {
  width: 2,
  height: 16,
  minWidth: 2,
  minHeight: 16,
  border: 0,
  borderRadius: 0,
}

function HandleWithAddButton({
  type,
  position,
  className,
}: HandleWithAddButtonProps) {
  const contextMenuActions = useWorkflowContextMenuActions()
  const [isHovered, setIsHovered] = useState(false)
  const hideButtonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  if (type === 'target') {
    return (
      <Handle
        type={type}
        position={position}
        className={className}
        style={handleLineStyle}
      />
    )
  }

  return (
    <Handle
      type={type}
      position={position}
      className={className}
      style={handleLineStyle}
      onMouseEnter={showButton}
      onMouseLeave={hideButton}
    >
      <button
        aria-label={`Add node from ${type} handle`}
        className={`nopan absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_6px_16px_rgba(37,99,235,0.28)] transition-all hover:bg-blue-700 ${
          showAddButton
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-75 opacity-0'
        }`}
        type="button"
        onMouseEnter={showButton}
        onMouseLeave={hideButton}
        onClick={event => {
          event.stopPropagation()
          contextMenuActions?.openAddMenuAtClientPosition({
            x: event.clientX,
            y: event.clientY,
          })
        }}
      >
        <span className="pointer-events-none text-2xl leading-none">+</span>
      </button>
      <div
        className={`pointer-events-none absolute bottom-[34px] z-20 w-[204px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-[16px] leading-6 text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition-all ${
          position === Position.Left ? 'left-1/2' : 'right-1/2'
        } ${
          isHovered && showAddButton
            ? 'translate-y-0 opacity-100'
            : 'translate-y-1 opacity-0'
        }`}
      >
        <span className="block">
          <strong className="font-semibold text-slate-700">Click</strong> to add
        </span>
        <span className="block">
          <strong className="font-semibold text-slate-700">Drag</strong> to
          connect
        </span>
      </div>
    </Handle>
  )
}

export default function BaseNode({
  title,
  tone = 'zinc',
  children,
  hasTarget = true,
  hasSource = true,
  minWidthClassName = 'min-w-[240px]',
  runStatus = 'idle',
}: BaseNodeProps) {
  const toneClass = toneClassMap[tone]
  const runStatusClassName =
    runStatus === 'running'
      ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_12px_28px_rgba(56,189,248,0.2)]'
      : runStatus === 'error'
        ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-red-50 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_12px_28px_rgba(248,113,113,0.18)]'
        : runStatus === 'completed'
          ? 'ring-1 ring-emerald-300 ring-offset-1 ring-offset-emerald-50'
          : ''

  return (
    <div className={'relative'}>
      <div
        className={`relative ${minWidthClassName} overflow-hidden rounded-2xl border bg-white shadow-sm transition ${toneClass.border} ${runStatusClassName}`.trim()}
      >
        <div
          className={`border-b px-3 py-2.5 ${toneClass.border} ${toneClass.headerBg}`}
        >
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${toneClass.title}`}>
              {title}
            </p>
          </div>
        </div>

        {children ? <div className="space-y-3 p-3">{children}</div> : null}

        {runStatus !== 'idle' && (
          <div className="absolute right-2 top-2.5">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                runStatus === 'running'
                  ? 'bg-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]'
                  : runStatus === 'error'
                    ? 'bg-red-500 shadow-[0_0_0_4px_rgba(248,113,113,0.14)]'
                    : 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
              }`}
            />
          </div>
        )}
      </div>
      {hasTarget && (
        <HandleWithAddButton
          type="target"
          position={Position.Left}
          className={`h-4! w-0.5! rounded-none! border-0! ${toneClass.handle}`}
        />
      )}
      {hasSource && (
        <HandleWithAddButton
          type="source"
          position={Position.Right}
          className={`h-4! w-0.5! rounded-none! border-0! ${toneClass.handle}`}
        />
      )}
    </div>
  )
}
