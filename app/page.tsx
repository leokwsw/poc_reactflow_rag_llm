"use client";

import { useCallback, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  updateEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnEdgeUpdateFunc,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import EndNode from "@/app/components/workflow/nodes/end-node";
import LlmNode from "@/app/components/workflow/nodes/llm-node";
import StartNode from "@/app/components/workflow/nodes/start-node";

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
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const nodeTypes = {
  start: StartNode,
  llm: LlmNode,
  end: EndNode,
};

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const wrapperRef = useRef<HTMLElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const edgeUpdateSuccessful = useRef(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      const flowPosition = reactFlowRef.current?.screenToFlowPosition({
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
    [],
  );

  const addNodeAtPointer = useCallback(
    (type: "default" | "start" | "llm" | "end") => {
      if (!contextMenu) return;

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
                : { label: "New Node" },
      };

      setNodes((prev) => [...prev, newNode]);
      closeContextMenu();
    },
    [closeContextMenu, contextMenu, setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) => addEdge({ ...connection, animated: true }, currentEdges));
    },
    [setEdges],
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback<OnEdgeUpdateFunc>(
    (oldEdge, newConnection) => {
      edgeUpdateSuccessful.current = true;
      setEdges((currentEdges) => updateEdge(oldEdge, newConnection, currentEdges));
    },
    [setEdges],
  );

  const onEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        setEdges((currentEdges) => currentEdges.filter((e) => e.id !== edge.id));
      }
      edgeUpdateSuccessful.current = true;
    },
    [setEdges],
  );

  return (
    <main
      ref={wrapperRef}
      className="relative h-screen w-full bg-zinc-50"
      onClick={closeContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        onPaneClick={closeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        edgesUpdatable
        deleteKeyCode={["Backspace", "Delete"]}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {contextMenu && (
        <div
          className="absolute z-20 min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            onClick={() => addNodeAtPointer("default")}
          >
            Add Default Node
          </button>
          <button
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            onClick={() => addNodeAtPointer("start")}
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
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
            onClick={() => addNodeAtPointer("end")}
          >
            Add End Node
          </button>
        </div>
      )}
    </main>
  );
}
