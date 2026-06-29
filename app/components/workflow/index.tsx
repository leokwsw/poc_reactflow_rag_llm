'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  type Edge,
  EdgeChange,
  type Node,
  NodeChange,
  type OnEdgeUpdateFunc,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  updateEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow'

import CustomConnectionLine from '@/app/components/workflow/edges/custom-connection-line'
import { useWorkflowContextMenu } from '@/app/components/workflow/hooks/use-workflow-context-menu'
import { useWorkflowFocusNode } from '@/app/components/workflow/hooks/use-workflow-focus-node'
import { useWorkflowHistory } from '@/app/components/workflow/hooks/use-workflow-history'
import { useWorkflowOrganize } from '@/app/components/workflow/hooks/use-workflow-organize'
import { isCustomNodeType } from '@/app/components/workflow/nodes/allowed'
import { edgeTypes, nodeTypes } from '@/app/components/workflow/nodes/types'
import Operator from '@/app/components/workflow/operator'
import Control from '@/app/components/workflow/operator/control'
import PanelContextMenu from '@/app/components/workflow/panel-contextmenu'
import { WorkflowDataType } from '@/app/components/workflow/types'
import { WorkflowContextMenuProvider } from '@/app/components/workflow/workflow-context-menu-context'

import 'reactflow/dist/style.css'

type ControlMode = 'pointer' | 'hand'
type WorkflowProps = {
  initData: WorkflowDataType
  onNodeSelect?: (node: Node | null) => void
  nodeDataPatch?: {
    id: string
    data: Record<string, unknown>
    nonce: number
  } | null
  focusNodeRequest?: {
    id: string
    nonce: number
  } | null
  onDataChange?: (data: WorkflowDataType) => void
  runNodeState?: {
    activeNodeId?: string | null
    errorNodeId?: string | null
    completedNodeIds?: string[]
  } | null
}

function normalizeNodeGuards(node: Node): Node {
  return {
    ...node,
    deletable: node.data?.type === 'start' ? false : node.deletable,
  }
}

function removeUnsupportedNodes(data: WorkflowDataType): WorkflowDataType {
  const nodes = data.nodes.filter(node => isCustomNodeType(node.data?.type))
  const nodeIds = new Set(nodes.map(node => node.id))

  return {
    ...data,
    nodes,
    edges: data.edges
      .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map(edge => ({ ...edge, type: 'custom' })),
  }
}

function WorkflowCanvas({
  initData,
  onNodeSelect,
  nodeDataPatch,
  focusNodeRequest,
  onDataChange,
  runNodeState,
}: WorkflowProps) {
  const supportedInitData = useMemo(
    () => removeUnsupportedNodes(initData),
    [initData],
  )
  const [nodes, setNodes] = useNodesState(
    supportedInitData.nodes.map(normalizeNodeGuards),
  )
  const [edges, setEdges] = useEdgesState(supportedInitData.edges)
  const [controlMode, setControlMode] = useState<ControlMode>('hand')
  const wrapperRef = useRef<HTMLElement | null>(null)
  const initMetaRef = useRef({
    readOnly: supportedInitData.readOnly,
    viewport: supportedInitData.viewport,
  })
  const reactflow = useReactFlow()
  const edgeUpdateSuccessful = useRef(true)
  const blockedProtectedEdgeRemovalIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    initMetaRef.current = {
      readOnly: supportedInitData.readOnly,
      viewport: supportedInitData.viewport,
    }
  }, [supportedInitData.readOnly, supportedInitData.viewport])

  const {
    historyState,
    pushUndoSnapshot,
    handleHistoryBack,
    handleHistoryForward,
  } = useWorkflowHistory({
    nodes,
    edges,
    setNodes,
    setEdges,
  })

  const notifyDataChange = useCallback(
    (nextNodes = nodes, nextEdges = edges) => {
      if (!onDataChange) return
      const meta = initMetaRef.current
      const viewport = reactflow.viewportInitialized
        ? reactflow.getViewport()
        : meta.viewport
      onDataChange({
        nodes: structuredClone(nextNodes),
        edges: structuredClone(nextEdges),
        readOnly: meta.readOnly,
        viewport: { ...viewport },
      })
    },
    [edges, nodes, onDataChange, reactflow],
  )

  const { handleLayout } = useWorkflowOrganize({
    canOrganize: () => !initMetaRef.current.readOnly,
    setNodes,
    onBeforeOrganize: pushUndoSnapshot,
    onAfterOrganize: organizedNodes => notifyDataChange(organizedNodes, edges),
  })

  const {
    contextMenu,
    closeContextMenu,
    handlePaneContextMenu,
    handleOpenAddMenuFromControl,
    openAddMenuAtClientPosition,
    openAddMenuAtFlowPosition,
    addNodeAtPointer,
  } = useWorkflowContextMenu({
    reactflow,
    wrapperRef,
    nodes,
    setNodes,
    pushUndoSnapshot,
  })

  const _onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const protectedNodeIds = new Set(
        nodes.filter(node => node.data?.type === 'start').map(node => node.id),
      )
      const blockedEdgeIds = new Set<string>()

      changes.forEach(change => {
        if (change.type !== 'remove' || !protectedNodeIds.has(change.id)) {
          return
        }

        edges.forEach(edge => {
          if (edge.source === change.id || edge.target === change.id) {
            blockedEdgeIds.add(edge.id)
          }
        })
      })

      blockedProtectedEdgeRemovalIdsRef.current = blockedEdgeIds
      const safeChanges = changes.filter(change => {
        if (change.type !== 'remove') {
          return true
        }

        return !protectedNodeIds.has(change.id)
      })

      setNodes(nds => applyNodeChanges(safeChanges, nds))
    },
    [edges, nodes, setNodes],
  )
  const _onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const blockedEdgeIds = blockedProtectedEdgeRemovalIdsRef.current
      const safeChanges = changes.filter(change => {
        if (change.type !== 'remove') {
          return true
        }

        return !blockedEdgeIds.has(change.id)
      })

      blockedProtectedEdgeRemovalIdsRef.current = new Set()
      setEdges(edges => applyEdgeChanges(safeChanges, edges))
    },
    [setEdges],
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node)
    },
    [onNodeSelect],
  )

  const hasStartNode = nodes.some(node => node.data.type === 'start')

  useEffect(() => {
    if (!nodeDataPatch) return
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeDataPatch.id
          ? {
              ...node,
              data: {
                ...node.data,
                ...nodeDataPatch.data,
              },
            }
          : node,
      ),
    )
  }, [nodeDataPatch, setNodes])

  useEffect(() => {
    const activeNodeId = runNodeState?.activeNodeId ?? null
    const errorNodeId = runNodeState?.errorNodeId ?? null
    const completedNodeIds = new Set(runNodeState?.completedNodeIds ?? [])

    setNodes(prev =>
      prev.map(node => {
        const currentStatus =
          typeof node.data?.runStatus === 'string'
            ? node.data.runStatus
            : 'idle'
        const nextStatus =
          errorNodeId === node.id
            ? 'error'
            : activeNodeId === node.id
              ? 'running'
              : completedNodeIds.has(node.id)
                ? 'completed'
                : 'idle'

        if (currentStatus === nextStatus) {
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            runStatus: nextStatus,
          },
        }
      }),
    )
  }, [runNodeState, setNodes])

  useWorkflowFocusNode({
    focusNodeRequest,
    nodes,
    setNodes,
    reactflow,
    onNodeSelect,
  })

  useEffect(() => {
    notifyDataChange()
  }, [nodes, edges, notifyDataChange])

  const handleMoveEnd = useCallback(() => {
    notifyDataChange()
  }, [notifyDataChange])

  const onConnect = useCallback(
    (connection: Connection) => {
      pushUndoSnapshot()
      const newEdge = addEdge(
        {
          ...connection,
          type: 'custom',
          style: { opacity: 1, strokeWidth: 2 },
        },
        edges,
      )
      setEdges(newEdge)
    },
    [pushUndoSnapshot, edges, setEdges],
  )

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false
  }, [])

  const onEdgeUpdate = useCallback<OnEdgeUpdateFunc>(
    (oldEdge, newConnection) => {
      pushUndoSnapshot()
      edgeUpdateSuccessful.current = true
      setEdges(currentEdges => updateEdge(oldEdge, newConnection, currentEdges))
    },
    [pushUndoSnapshot, setEdges],
  )

  const onEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        pushUndoSnapshot()
        setEdges(currentEdges => currentEdges.filter(e => e.id !== edge.id))
      }
      edgeUpdateSuccessful.current = true
    },
    [pushUndoSnapshot, setEdges],
  )

  return (
    <main
      ref={wrapperRef}
      className="relative h-full min-h-0 w-full bg-zinc-50"
      onClick={closeContextMenu}
    >
      <div
        className="left-4 pointer-events-none absolute top-0 z-10 flex w-12 items-center justify-center p-1 pl-2"
        style={{ height: '100%' }}
      >
        <Control
          onOpenAddMenu={handleOpenAddMenuFromControl}
          onOrganize={handleLayout}
          handleModePointer={() => setControlMode('pointer')}
          handleModeHand={() => setControlMode('hand')}
          mode={controlMode}
        />
      </div>
      <Operator
        handleUndo={handleHistoryBack}
        handleRedo={handleHistoryForward}
        canUndo={historyState.undo > 0}
        canRedo={historyState.redo > 0}
      />
      <WorkflowContextMenuProvider
        value={{
          canAddNode: !supportedInitData.readOnly,
          openAddMenuAtClientPosition,
          openAddMenuAtFlowPosition,
        }}
      >
        <ReactFlow
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodes={nodes}
          edges={edges}
          defaultViewport={supportedInitData.viewport}
          onNodesChange={_onNodesChange}
          onNodeClick={handleNodeClick}
          onEdgesChange={_onEdgesChange}
          onConnect={onConnect}
          onEdgeUpdate={onEdgeUpdate}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          onPaneClick={() => {
            closeContextMenu()
            onNodeSelect?.(null)
          }}
          onPaneContextMenu={handlePaneContextMenu}
          onMoveEnd={handleMoveEnd}
          connectionLineComponent={CustomConnectionLine}
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={controlMode === 'pointer' && !initData.readOnly}
          panOnDrag={controlMode === 'hand'}
          panOnScroll={controlMode === 'pointer' && !initData.readOnly}
          zoomOnPinch={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={true}
          nodesDraggable={!supportedInitData.readOnly}
          nodesConnectable={!supportedInitData.readOnly}
          nodesFocusable={!supportedInitData.readOnly}
          edgesFocusable={!supportedInitData.readOnly}
          edgesUpdatable
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.25}
        >
          <Background
            gap={[14, 14]}
            size={2}
            className="bg-workflow-canvas-workflow-bg"
            color="rgb(133 133 173 / 0.11)"
          />
        </ReactFlow>
      </WorkflowContextMenuProvider>
      {contextMenu && (
        <PanelContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasStartNode={hasStartNode}
          onAddNode={addNodeAtPointer}
        />
      )}
    </main>
  )
}

export default function Workflow({
  initData,
  onNodeSelect,
  nodeDataPatch,
  focusNodeRequest,
  onDataChange,
  runNodeState,
}: WorkflowProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas
        initData={initData}
        onNodeSelect={onNodeSelect}
        nodeDataPatch={nodeDataPatch}
        focusNodeRequest={focusNodeRequest}
        onDataChange={onDataChange}
        runNodeState={runNodeState}
      />
    </ReactFlowProvider>
  )
}
