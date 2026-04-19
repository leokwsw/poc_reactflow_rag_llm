"use client";

import { useEffect, useRef } from "react";
import type { Node, ReactFlowInstance } from "reactflow";

type FocusNodeRequest = {
  id: string;
  nonce: number;
};

type UseWorkflowFocusNodeOptions = {
  focusNodeRequest?: FocusNodeRequest | null;
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  reactflow: ReactFlowInstance;
  onNodeSelect?: (node: Node | null) => void;
};

export function useWorkflowFocusNode({
  focusNodeRequest,
  nodes,
  setNodes,
  reactflow,
  onNodeSelect,
}: UseWorkflowFocusNodeOptions) {
  const handledFocusNonceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!focusNodeRequest)
      return;
    if (handledFocusNonceRef.current === focusNodeRequest.nonce)
      return;

    const targetNode = nodes.find((node) => node.id === focusNodeRequest.id);
    if (!targetNode)
      return;

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
}
