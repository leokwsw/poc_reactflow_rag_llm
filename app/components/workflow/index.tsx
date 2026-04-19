"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {
  addEdge, applyEdgeChanges, applyNodeChanges,
  Background,
  type Connection,
  type Edge, EdgeChange,
  type Node, NodeChange,
  type OnEdgeUpdateFunc,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  updateEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {nodeTypes} from "@/app/components/workflow/nodes/types";
import Control from "@/app/components/workflow/operator/control";
import Operator from "@/app/components/workflow/operator";
import PanelContextMenu from "@/app/components/workflow/panel-contextmenu";
import {WorkflowDataType} from "@/app/components/workflow/types";
import {useWorkflowOrganize} from "@/app/components/workflow/hooks/use-workflow-organize";
import {useWorkflowHistory} from "@/app/components/workflow/hooks/use-workflow-history";
import {useWorkflowContextMenu} from "@/app/components/workflow/hooks/use-workflow-context-menu";
import {useWorkflowFocusNode} from "@/app/components/workflow/hooks/use-workflow-focus-node";

type ControlMode = "pointer" | "hand";
type WorkflowProps = {
  initData: WorkflowDataType
  onNodeSelect?: (node: Node | null) => void;
  nodeDataPatch?: {
    id: string;
    data: Record<string, unknown>;
    nonce: number;
  } | null;
  focusNodeRequest?: {
    id: string;
    nonce: number;
  } | null;
  onDataChange?: (data: WorkflowDataType) => void;
};

function WorkflowCanvas({initData, onNodeSelect, nodeDataPatch, focusNodeRequest, onDataChange}: WorkflowProps) {
  const [nodes, setNodes] = useNodesState(initData.nodes);
  const [edges, setEdges] = useEdgesState(initData.edges);
  const [controlMode, setControlMode] = useState<ControlMode>("hand");
  const wrapperRef = useRef<HTMLElement | null>(null);
  const initMetaRef = useRef({readOnly: initData.readOnly, viewport: initData.viewport});
  const reactflow = useReactFlow();
  const edgeUpdateSuccessful = useRef(true);

  useEffect(() => {
    initMetaRef.current = {readOnly: initData.readOnly, viewport: initData.viewport};
  }, [initData.readOnly, initData.viewport]);

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
  });

  const {handleLayout} = useWorkflowOrganize({
    canOrganize: () => !initMetaRef.current.readOnly,
    setNodes,
    onBeforeOrganize: pushUndoSnapshot,
  });

  const {
    contextMenu,
    closeContextMenu,
    handlePaneContextMenu,
    handleOpenAddMenuFromControl,
    addNodeAtPointer,
  } = useWorkflowContextMenu({
    reactflow,
    wrapperRef,
    nodes,
    setNodes,
    pushUndoSnapshot,
  });

  const _onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(nds => applyNodeChanges(changes, nds))
    },
    [setNodes],
  )
  const _onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(edges => applyEdgeChanges(changes, edges))
    },
    [setEdges],
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect],
  );

  const hasStartNode = nodes.some((node) => node.data.type === "start");

  useEffect(() => {
    if (!nodeDataPatch) return;
    setNodes((prev) =>
      prev.map((node) =>
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
    );
  }, [nodeDataPatch, setNodes]);

  useWorkflowFocusNode({
    focusNodeRequest,
    nodes,
    setNodes,
    reactflow,
    onNodeSelect,
  });

  const notifyDataChange = useCallback(() => {
    if (!onDataChange) return;
    const meta = initMetaRef.current;
    const viewport = reactflow.viewportInitialized
      ? reactflow.getViewport()
      : meta.viewport;
    onDataChange({
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      readOnly: meta.readOnly,
      viewport: {...viewport},
    });
  }, [edges, nodes, onDataChange, reactflow]);

  useEffect(() => {
    notifyDataChange();
  }, [nodes, edges, notifyDataChange]);

  const onConnect = useCallback(
    (connection: Connection) => {
      pushUndoSnapshot();
      const newEdge = addEdge(
          {
            ...connection,
            style: {strokeDasharray: "4 4", strokeWidth: 1.5},
          },
          edges,
        )
      setEdges(newEdge);
    },
    [pushUndoSnapshot, edges, setEdges],
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback<OnEdgeUpdateFunc>(
    (oldEdge, newConnection) => {
      pushUndoSnapshot();
      edgeUpdateSuccessful.current = true;
      setEdges((currentEdges) => updateEdge(oldEdge, newConnection, currentEdges));
    },
    [pushUndoSnapshot, setEdges],
  );

  const onEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        pushUndoSnapshot();
        setEdges((currentEdges) => currentEdges.filter((e) => e.id !== edge.id));
      }
      edgeUpdateSuccessful.current = true;
    },
    [pushUndoSnapshot, setEdges],
  );

  return (
    <main
      ref={wrapperRef}
      className="relative h-screen w-full bg-zinc-50"
      onClick={closeContextMenu}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 flex w-12 items-center justify-center p-1 pl-2"
        style={{height: "100%"}}
      >
        <Control
          onOpenAddMenu={handleOpenAddMenuFromControl}
          onOrganize={handleLayout}
          handleModePointer={() => setControlMode("pointer")}
          handleModeHand={() => setControlMode("hand")}
        />
      </div>
      <Operator
        handleUndo={handleHistoryBack}
        handleRedo={handleHistoryForward}
        canUndo={historyState.undo > 0}
        canRedo={historyState.redo > 0}
      />
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={_onNodesChange}
        onNodeClick={handleNodeClick}
        onEdgesChange={_onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onPaneClick={() => {
          closeContextMenu();
          onNodeSelect?.(null);
        }}
        onPaneContextMenu={handlePaneContextMenu}
        onMoveEnd={notifyDataChange}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={controlMode === "pointer" && !initData.readOnly}
        panOnDrag={controlMode === "hand"}
        panOnScroll={controlMode === "pointer" && !initData.readOnly}
        zoomOnPinch={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        nodesDraggable={!initData.readOnly}
        nodesConnectable={!initData.readOnly}
        nodesFocusable={!initData.readOnly}
        edgesFocusable={!initData.readOnly}
        edgesUpdatable
        deleteKeyCode={["Backspace", "Delete"]}
        minZoom={0.25}
      >
        <Background
          gap={[14, 14]}
          size={2}
          className="bg-workflow-canvas-workflow-bg"
          color="rgb(133 133 173 / 0.11)"
        />
      </ReactFlow>
      {contextMenu && (
        <PanelContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasStartNode={hasStartNode}
          onAddNode={addNodeAtPointer}
        />
      )}
    </main>
  );
}

export default function Workflow(
  {
    initData,
    onNodeSelect,
    nodeDataPatch,
    focusNodeRequest,
    onDataChange,
  }: WorkflowProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas
        initData={initData}
        onNodeSelect={onNodeSelect}
        nodeDataPatch={nodeDataPatch}
        focusNodeRequest={focusNodeRequest}
        onDataChange={onDataChange}
      />
    </ReactFlowProvider>
  );
}
