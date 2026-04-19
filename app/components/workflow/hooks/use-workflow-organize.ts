"use client";

import { useCallback } from "react";
import dagre from "dagre";
import type { Edge, Node, ReactFlowInstance } from "reactflow";

type LayoutNodeInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: number;
};

type UseWorkflowOrganizeOptions = {
  nodes: Node[];
  edges: Edge[];
  pushUndoSnapshot: () => void;
  setNodes: (payload: Node[]) => void;
  reactflow: ReactFlowInstance;
};

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
    if (edge.source && edge.target)
      graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const result = new Map<string, LayoutNodeInfo>();
  nodes.forEach((node) => {
    const layoutNode = graph.node(node.id);
    if (!layoutNode)
      return;

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

function buildLayerMap(layout: Map<string, LayoutNodeInfo>) {
  const layerMap = new Map<number, { minY: number; maxHeight: number }>();

  layout.forEach((layoutInfo) => {
    if (layoutInfo.layer === undefined)
      return;

    const existing = layerMap.get(layoutInfo.layer);
    layerMap.set(layoutInfo.layer, {
      minY: existing ? Math.min(existing.minY, layoutInfo.y) : layoutInfo.y,
      maxHeight: existing ? Math.max(existing.maxHeight, layoutInfo.height) : layoutInfo.height,
    });
  });

  return layerMap;
}

function applyLayoutToNodes(nodes: Node[], layout: Map<string, LayoutNodeInfo>) {
  const layerMap = buildLayerMap(layout);

  return structuredClone(nodes).map((node) => {
    const layoutInfo = layout.get(node.id);
    if (!layoutInfo)
      return node;

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
}

export const useWorkflowOrganize = ({
  nodes,
  edges,
  pushUndoSnapshot,
  setNodes,
  reactflow,
}: UseWorkflowOrganizeOptions) => {
  const handleLayout = useCallback(async () => {
    pushUndoSnapshot();

    const layout = await getLayoutByDagre(nodes, edges);
    const nextNodes = applyLayoutToNodes(nodes, layout);

    setNodes(nextNodes);
    reactflow.setViewport({
      x: 0,
      y: 0,
      zoom: 0.7,
    });
  }, [pushUndoSnapshot, nodes, edges, setNodes, reactflow]);

  return {
    handleLayout,
  };
};
