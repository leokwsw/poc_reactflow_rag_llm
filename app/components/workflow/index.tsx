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
import {CustomNodeType, nodeTypes} from "@/app/components/workflow/nodes/types";
import Control from "@/app/components/workflow/operator/control";
import Operator from "@/app/components/workflow/operator";
import PanelContextMenu from "@/app/components/workflow/panel-contextmenu";
import {WorkflowDataType} from "@/app/components/workflow/types";
import {useWorkflowOrganize} from "@/app/components/workflow/hooks/use-workflow-organize";

type ControlMode = "pointer" | "hand";
type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
};
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
function cloneFlowSnapshot(nodes: Node[], edges: Edge[]): FlowSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function WorkflowCanvas({initData, onNodeSelect, nodeDataPatch, focusNodeRequest, onDataChange}: WorkflowProps) {
  const [nodes, setNodes] = useNodesState(initData.nodes);
  const [edges, setEdges] = useEdgesState(initData.edges);
  const [controlMode, setControlMode] = useState<ControlMode>("hand");
  const [historyState, setHistoryState] = useState({undo: 0, redo: 0});
  const wrapperRef = useRef<HTMLElement | null>(null);
  const initMetaRef = useRef({readOnly: initData.readOnly, viewport: initData.viewport});
  const reactflow = useReactFlow();
  const edgeUpdateSuccessful = useRef(true);
  const handledFocusNonceRef = useRef<number | null>(null);
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

  useEffect(() => {
    initMetaRef.current = {readOnly: initData.readOnly, viewport: initData.viewport};
  }, [initData.readOnly, initData.viewport]);

  const pushUndoSnapshot = useCallback(() => {
    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    historyRef.current.redo = [];
    setHistoryState({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
  }, [edges, nodes]);

  const {handleLayout} = useWorkflowOrganize({
    nodes,
    edges,
    pushUndoSnapshot,
    setNodes,
    reactflow,
  });

  const handleHistoryBack = useCallback(() => {
    const previous = historyRef.current.undo.pop();
    if (!previous) return;

    historyRef.current.redo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setHistoryState({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
  }, [edges, nodes, setEdges, setNodes]);

  const handleHistoryForward = useCallback(() => {
    const next = historyRef.current.redo.pop();
    if (!next) return;

    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryState({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
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
      const flowPosition = reactflow.screenToFlowPosition({x: clientX, y: clientY});
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

  const addNodeAtPointer = useCallback(
    (type: CustomNodeType) => {
      if (!contextMenu) return;

      if (["start", "end"].includes(type) && nodes.some((node) => node.data.type === type))
        return;

      pushUndoSnapshot();

      let data: Record<string, unknown> = {
        type: type
      }

      if (type === "start") {
        data = {...data, label: "Start", variables: [{name: "query", required: true, type: "string"}]};
      } else if (type === "agent") {
        data = {...data, label: "Agent", role: "General-purpose assistant", tools: ["web_search", "calculator"]};
      } else if (type === "assigner") {
        data = {...data, label: "Assigner", assignments: [{target: "summary", value: "{{query}}"}]};
      } else if (type === "code") {
        data = {...data, label: "Code", language: "JavaScript", code: "return { result: input };"};
      } else if (type === "dataSource") {
        data = {...data, label: "Data Source", sourceType: "File Upload", variableName: "source_data"};
      } else if (type === "dataSourceEmpty") {
        data = {...data, label: "Data Source Empty", message: "Waiting for data source selection"};
      } else if (type === "http") {
        data = {...data, label: "HTTP", method: "GET", url: "https://api.example.com"};
      } else if (type === "iteration") {
        data = {...data, label: "Iteration", iterator: "items", itemName: "item"};
      } else if (type === "iterationStart") {
        data = {...data, label: "Iteration Start", scopeName: "iteration_scope"};
      } else if (type === "listOperator") {
        data = {...data, label: "List Operator", operation: "map", targetList: "items"};
      } else if (type === "llm") {
        data = {
          ...data,
          label: "LLM",
          provider: "openai",
          apiBaseUrl: "https://api.openai.com/v1",
          apiKey: "",
          model: "gpt-4o-mini",
          systemPrompt: "You are a helpful assistant.",
        };
      } else if (type === "end") {
        data = {...data, label: "End", outputs: ["2.text"]};
      } else if (type === "ifElse") {
        data = {
          ...data,
          label: "If / Else",
          cases: [
            {id: "if", label: "IF", conditions: ["query contains 'help'"]},
            {id: "elif-1", label: "ELIF", conditions: ["files count > 0"]},
          ],
        };
      } else if (type === "loop") {
        data = {...data, label: "Loop", condition: "count < 10", maxIterations: 10};
      } else if (type === "loopEnd") {
        data = {...data, label: "Loop End", aggregate: "collect_results"};
      } else if (type === "loopStart") {
        data = {...data, label: "Loop Start", scopeName: "loop_scope"};
      } else if (type === "note") {
        data = {...data, text: "New note", author: "You", theme: "yellow"};
      } else if (type === "parameterExtractor") {
        data = {...data, label: "Parameter Extractor", parameters: [{name: "product", type: "string"}]};
      } else if (type === "questionClassifier") {
        data = {
          ...data,
          label: "Question Classifier",
          apiBaseUrl: "https://api.openai.com/v1",
          apiKey: "",
          model: "gpt-4o-mini",
          instruction: "Classify the query into exactly one class and return the class id only.",
          classes: [{id: "sales", name: "Sales"}, {id: "support", name: "Support"}],
        };
      } else if (type === "simple") {
        data = {...data, label: "Simple Node", description: "Simple node content"};
      } else if (type === "templateTransform") {
        data = {...data, label: "Template Transform", template: "Hello {{query}}"};
      } else if (type === "tool") {
        data = {...data, label: "Tool", toolName: "web_search", outputSchema: ["title", "url", "snippet"]};
      } else if (type === "variableAssigner") {
        data = {...data, label: "Variable Assigner", variables: [{name: "result", expression: "{{query}}"}]};
      } else if (type === "knowledgeBase") {
        data = {
          ...data,
          label: "Knowledge Base",
          indexingTechnique: "high_quality",
          retrievalSearchMethod: "semantic_search",
        };
      } else {
        data = {
          ...data,
          label: "Knowledge Retrieval",
          datasets: [
            {id: "kb-1", name: "Product Docs"},
            {id: "kb-2", name: "Support FAQ"},
          ],
        };
      }

      const newNode: Node = {
        id: crypto.randomUUID(),
        type: "custom",
        position: {x: contextMenu.flowX, y: contextMenu.flowY},
        data
      };

      setNodes((prev) => {
        return [...prev, newNode];
      });
      closeContextMenu();
    },
    [closeContextMenu, contextMenu, nodes, pushUndoSnapshot, setNodes],
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

  useEffect(() => {
    if (!focusNodeRequest) return;
    if (handledFocusNonceRef.current === focusNodeRequest.nonce) return;

    const targetNode = nodes.find((node) => node.id === focusNodeRequest.id);
    if (!targetNode) return;
    handledFocusNonceRef.current = focusNodeRequest.nonce;

    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        selected: node.id === focusNodeRequest.id,
      })),
    );
    onNodeSelect?.(targetNode);

    const width = targetNode.width ?? 220;
    const height = targetNode.height ?? 120;
    reactflow.setCenter(targetNode.position.x + width / 2, targetNode.position.y + height / 2, {
      zoom: Math.max(reactflow.getZoom(), 0.7),
      duration: 500,
    });
  }, [focusNodeRequest, nodes, onNodeSelect, reactflow, setNodes]);

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
