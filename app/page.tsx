"use client";

import { useCallback, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  updateEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgeUpdateFunc,
} from "reactflow";
import "reactflow/dist/style.css";
import AnswerNode from "@/app/components/workflow/nodes/answer-node";
import EndNode from "@/app/components/workflow/nodes/end-node";
import IfElseNode from "@/app/components/workflow/nodes/if-else-node";
import LlmNode from "@/app/components/workflow/nodes/llm-node";
import StartNode from "@/app/components/workflow/nodes/start-node";
import Control from "@/app/components/workflow/operator/control";
import Operator from "@/app/components/workflow/operator";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "start",
    position: { x: 100, y: 120 },
    data: {
      label: "Start",
      variables: [
        { name: "query", required: true, type: "string" },
        { name: "files", type: "file[]" },
      ],
    },
  },
  {
    id: "2",
    type: "llm",
    position: { x: 380, y: 120 },
    data: { label: "LLM", provider: "openai", model: "gpt-4o-mini" },
  },
  {
    id: "3",
    type: "end",
    position: { x: 680, y: 120 },
    data: { label: "End", outputs: ["2.text", "2.usage.total_tokens"] },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    style: {
      strokeDasharray: undefined,
      opacity: 1,
      strokeWidth: 2
    },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    style: {
      strokeDasharray: undefined,
      opacity: 1,
      strokeWidth: 2
    },
  },
];

const nodeTypes = {
  start: StartNode,
  llm: LlmNode,
  end: EndNode,
  ifElse: IfElseNode,
  answer: AnswerNode,
};

type ControlMode = "pointer" | "hand";
type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

function cloneFlowSnapshot(nodes: Node[], edges: Edge[]): FlowSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function WorkflowCanvas() {
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

  const addNodeAtPointer = useCallback(
    (type: "start" | "llm" | "end" | "ifElse" | "answer") => {
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
            : { label: "Answer", answer: "{{2.text}}" },
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
  const [maximizeCanvas, setMaximizeCanvas] = useState(false);

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
          mode={controlMode}
          maximizeCanvas={maximizeCanvas}
          onModePointer={() => setControlMode("pointer")}
          onModeHand={() => setControlMode("hand")}
          onToggleMaximizeCanvas={() => setMaximizeCanvas((v) => !v)}
          onOrganize={() => reactflow.fitView({ duration: 300 })}
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
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onPaneClick={closeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={controlMode === "pointer"}
        panOnDrag={controlMode === "hand" ? [1] : false}
        panOnScroll={controlMode === "hand"}
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick
        nodesDraggable
        nodesConnectable
        nodesFocusable
        edgesFocusable
        edgesUpdatable
        deleteKeyCode={["Backspace", "Delete"]}
        minZoom={0.25}
        fitView
      >
        <Background gap={[14, 14]} size={2} />
        <Controls />
      </ReactFlow>
      {contextMenu && (
        <div
          className="absolute z-20 min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => addNodeAtPointer("start")}
            disabled={hasStartNode}
          >
            Add Start Node
          </button>
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            onClick={() => addNodeAtPointer("llm")}
          >
            Add LLM Node
          </button>
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => addNodeAtPointer("end")}
            disabled={hasEndNode}
          >
            Add End Node
          </button>
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            onClick={() => addNodeAtPointer("ifElse")}
          >
            Add If-Else Node
          </button>
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => addNodeAtPointer("answer")}
            disabled={hasAnswerNode}
          >
            Add Answer Node
          </button>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
