"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import dagre from "dagre";
import {
  addEdge,
  Background,
  type Connection,
  type Edge,
  type Node,
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
import { nodeTypes, type WorkflowNodeType } from "@/app/components/workflow/nodes/types";
import Control from "@/app/components/workflow/operator/control";
import Operator from "@/app/components/workflow/operator";
import PanelContextMenu from "@/app/components/workflow/panel-contextmenu";

type ControlMode = "pointer" | "hand";
type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
};
type WorkflowProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodeSelect?: (node: Node | null) => void;
  nodeDataPatch?: {
    id: string;
    data: Record<string, any>;
    nonce: number;
  } | null;
};
type LayoutNodeInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: number;
};

function cloneFlowSnapshot(nodes: Node[], edges: Edge[]): FlowSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

async function getLayoutByDagre(nodes: Node[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    ranksep: 120,
    nodesep: 80,
  });

  nodes.forEach((node) => {
    const width = node.width ?? 220;
    const height = node.height ?? 100;
    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    if (edge.source && edge.target) graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const result = new Map<string, LayoutNodeInfo>();
  nodes.forEach((node) => {
    const layoutNode = graph.node(node.id);
    if (!layoutNode) return;

    result.set(node.id, {
      x: layoutNode.x - layoutNode.width / 2,
      y: layoutNode.y - layoutNode.height / 2,
      width: layoutNode.width,
      height: layoutNode.height,
      layer: Math.round(layoutNode.x / 100),
    });
  });

  return result;
}

function WorkflowCanvas({ initialNodes, initialEdges, onNodeSelect, nodeDataPatch }: WorkflowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [controlMode, setControlMode] = useState<ControlMode>("pointer");
  const wrapperRef = useRef<HTMLElement | null>(null);
  const reactflow = useReactFlow();
  const edgeUpdateSuccessful = useRef(true);
  const historyRef = useRef<{ undo: FlowSnapshot[]; redo: FlowSnapshot[] }>({
    undo: [],
    redo: [],
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const pushUndoSnapshot = useCallback(() => {
    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    historyRef.current.redo = [];
  }, [edges, nodes]);

  const handleHistoryBack = useCallback(() => {
    const previous = historyRef.current.undo.pop();
    if (!previous) return;

    historyRef.current.redo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [edges, nodes, setEdges, setNodes]);

  const handleHistoryForward = useCallback(() => {
    const next = historyRef.current.redo.pop();
    if (!next) return;

    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [edges, nodes, setEdges, setNodes]);

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      const flowPosition = reactflow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      if (!flowPosition) return;

      setContextMenu({
        x: event.clientX - (wrapperRect?.left ?? 0),
        y: event.clientY - (wrapperRect?.top ?? 0),
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [reactflow],
  );

  const handleOpenAddMenuFromControl = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;

      const buttonRect = event.currentTarget.getBoundingClientRect();
      const clientX = buttonRect.right + 8;
      const clientY = buttonRect.top + buttonRect.height / 2;
      const flowPosition = reactflow.screenToFlowPosition({ x: clientX, y: clientY });
      if (!flowPosition) return;

      setContextMenu({
        x: clientX - wrapperRect.left,
        y: clientY - wrapperRect.top,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [reactflow],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect],
  );

  const addNodeAtPointer = useCallback(
    (type: WorkflowNodeType) => {
      if (!contextMenu) return;

      if (["start", "end", "answer"].includes(type) && nodes.some((node) => node.type === type))
        return;

      pushUndoSnapshot();

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position: { x: contextMenu.flowX, y: contextMenu.flowY },
        data:
          type === "start"
            ? {
                label: "Start",
                variables: [{ name: "query", required: true, type: "string" }],
              }
            : type === "llm"
              ? { label: "LLM", provider: "openai", model: "gpt-4o-mini" }
              : type === "end"
                ? { label: "End", outputs: ["2.text"] }
                : type === "ifElse"
                  ? {
                      label: "If / Else",
                      cases: [
                        { id: "if", label: "IF", conditions: ["query contains 'help'"] },
                        { id: "elif-1", label: "ELIF", conditions: ["files count > 0"] },
                      ],
                    }
                  : type === "answer"
                    ? { label: "Answer", answer: "{{2.text}}" }
                    : type === "note"
                      ? { text: "New note", author: "You", theme: "yellow" }
                      : type === "simple"
                        ? { label: "Simple Node", description: "Simple node content" }
                        : type === "knowledgeBase"
                          ? {
                              label: "Knowledge Base",
                              indexingTechnique: "high_quality",
                              retrievalSearchMethod: "semantic_search",
                            }
                          : {
                              label: "Knowledge Retrieval",
                              datasets: [
                                { id: "kb-1", name: "Product Docs" },
                                { id: "kb-2", name: "Support FAQ" },
                              ],
                            },
      };

      setNodes((prev) => {
        return [...prev, newNode];
      });
      closeContextMenu();
    },
    [closeContextMenu, contextMenu, nodes, pushUndoSnapshot, setNodes],
  );

  const hasStartNode = nodes.some((node) => node.type === "start");
  const hasEndNode = nodes.some((node) => node.type === "end");
  const hasAnswerNode = nodes.some((node) => node.type === "answer");

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

  const onConnect = useCallback(
    (connection: Connection) => {
      pushUndoSnapshot();
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            style: { strokeDasharray: "4 4", strokeWidth: 1.5 },
          },
          currentEdges,
        ),
      );
    },
    [pushUndoSnapshot, setEdges],
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

  const handleLayout = useCallback(async () => {
    pushUndoSnapshot();
    const layout = await getLayoutByDagre(nodes, edges);

    const layerMap = new Map<number, { minY: number; maxHeight: number }>();
    layout.forEach((layoutInfo) => {
      if (layoutInfo.layer === undefined) return;
      const existing = layerMap.get(layoutInfo.layer);
      layerMap.set(layoutInfo.layer, {
        minY: existing ? Math.min(existing.minY, layoutInfo.y) : layoutInfo.y,
        maxHeight: existing ? Math.max(existing.maxHeight, layoutInfo.height) : layoutInfo.height,
      });
    });

    const newNodes = structuredClone(nodes).map((node) => {
      const layoutInfo = layout.get(node.id);
      if (!layoutInfo) return node;

      let yPosition = layoutInfo.y;
      if (layoutInfo.layer !== undefined) {
        const layerInfo = layerMap.get(layoutInfo.layer);
        if (layerInfo) {
          const layerCenterY = layerInfo.minY + layerInfo.maxHeight / 2;
          yPosition = layerCenterY - layoutInfo.height / 2;
        }
      }

      return {
        ...node,
        position: {
          x: layoutInfo.x,
          y: yPosition,
        },
      };
    });

    setNodes(newNodes);
    reactflow.setViewport({
      x: 0,
      y: 0,
      zoom: 0.7,
    });
  }, [pushUndoSnapshot, nodes, edges, setNodes, reactflow]);

  return (
    <main
      ref={wrapperRef}
      className="relative h-screen w-full bg-zinc-50"
      onClick={closeContextMenu}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 flex w-12 items-center justify-center p-1 pl-2"
        style={{ height: "100%" }}
      >
        <Control
          onOpenAddMenu={handleOpenAddMenuFromControl}
          onOrganize={handleLayout}
        />
      </div>
      <Operator
        handleUndo={handleHistoryBack}
        handleRedo={handleHistoryForward}
        canUndo={historyRef.current.undo.length > 0}
        canRedo={historyRef.current.redo.length > 0}
      />
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onPaneClick={() => {
          closeContextMenu();
          onNodeSelect?.(null);
        }}
        onPaneContextMenu={handlePaneContextMenu}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={controlMode === "pointer"}
        panOnDrag={controlMode === "hand" ? [1] : false}
        panOnScroll={controlMode === "hand"}
        zoomOnPinch={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        nodesDraggable
        nodesConnectable
        nodesFocusable
        edgesFocusable
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
          hasEndNode={hasEndNode}
          hasAnswerNode={hasAnswerNode}
          onAddNode={addNodeAtPointer}
        />
      )}
    </main>
  );
}

export default function Workflow({
  initialNodes,
  initialEdges,
  onNodeSelect,
  nodeDataPatch,
}: WorkflowProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        onNodeSelect={onNodeSelect}
        nodeDataPatch={nodeDataPatch}
      />
    </ReactFlowProvider>
  );
}
