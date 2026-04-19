"use client";

import { useCallback, useRef, useState } from "react";
import type { Edge, Node } from "reactflow";

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

type UseWorkflowHistoryOptions = {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
};

export function useWorkflowHistory({
  nodes,
  edges,
  setNodes,
  setEdges,
}: UseWorkflowHistoryOptions) {
  const historyRef = useRef<{ undo: FlowSnapshot[]; redo: FlowSnapshot[] }>({
    undo: [],
    redo: [],
  });
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 });

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
  }, []);

  const pushUndoSnapshot = useCallback(() => {
    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    historyRef.current.redo = [];
    syncHistoryState();
  }, [edges, nodes, syncHistoryState]);

  const handleHistoryBack = useCallback(() => {
    const previous = historyRef.current.undo.pop();
    if (!previous)
      return;

    historyRef.current.redo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    syncHistoryState();
  }, [edges, nodes, setEdges, setNodes, syncHistoryState]);

  const handleHistoryForward = useCallback(() => {
    const next = historyRef.current.redo.pop();
    if (!next)
      return;

    historyRef.current.undo.push(cloneFlowSnapshot(nodes, edges));
    setNodes(next.nodes);
    setEdges(next.edges);
    syncHistoryState();
  }, [edges, nodes, setEdges, setNodes, syncHistoryState]);

  return {
    historyState,
    pushUndoSnapshot,
    handleHistoryBack,
    handleHistoryForward,
  };
}
