"use client";

import { useCallback } from "react";
import dagre from "dagre";
import { useReactFlow, useStoreApi } from "reactflow";
import type { Edge, Node } from "reactflow";

type LayoutNodeInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  layerX: number;
};

type UseWorkflowOrganizeOptions = {
  canOrganize: () => boolean;
  setNodes: (payload: Node[]) => void;
  onBeforeOrganize?: () => void;
  onAfterOrganize?: (nodes: Node[]) => void;
};

async function getLayoutByDagre(nodes: Node[], edges: Edge[]) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    ranksep: 180,
    nodesep: 90,
    edgesep: 40,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    const measured = node as Node & { measured?: { width?: number; height?: number } };
    const width = measured.measured?.width ?? node.width ?? 260;
    const height = measured.measured?.height ?? node.height ?? 120;
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
      layerX: layoutNode.x,
    });
  });

  return result;
}

function getConnectedComponents(nodes: Node[], edges: Edge[]) {
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));
  edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  nodes.forEach((node) => {
    if (visited.has(node.id))
      return;

    const queue = [node.id];
    const component: string[] = [];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      adjacency.get(current)?.forEach((neighbor) => {
        if (visited.has(neighbor))
          return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    components.push(component);
  });

  return components;
}

function wrapDenseLayers(layout: Map<string, LayoutNodeInfo>) {
  const layers = new Map<number, Array<{ nodeId: string; info: LayoutNodeInfo }>>();

  layout.forEach((info, nodeId) => {
    const key = Math.round(info.layerX);
    const layer = layers.get(key) ?? [];
    layer.push({ nodeId, info });
    layers.set(key, layer);
  });

  const orderedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
  const positions = new Map<string, { x: number; y: number }>();
  const maxRowsPerLayer = 12;
  const columnGap = 72;
  const rowGap = 32;
  const rankGap = 180;
  let currentX = 0;

  orderedLayerKeys.forEach((layerKey) => {
    const items = (layers.get(layerKey) ?? []).sort((a, b) => a.info.y - b.info.y);
    if (items.length === 0)
      return;

    const maxWidth = Math.max(...items.map((item) => item.info.width));
    const maxHeight = Math.max(...items.map((item) => item.info.height));
    const columns = Math.max(1, Math.ceil(items.length / maxRowsPerLayer));
    const rows = Math.ceil(items.length / columns);
    const layerWidth = (columns * maxWidth) + ((columns - 1) * columnGap);

    items.forEach((item, index) => {
      const columnIndex = Math.floor(index / rows);
      const rowIndex = index % rows;
      positions.set(item.nodeId, {
        x: currentX + (columnIndex * (maxWidth + columnGap)),
        y: rowIndex * (maxHeight + rowGap),
      });
    });

    currentX += layerWidth + rankGap;
  });

  return positions;
}

async function getOrganizedPositions(nodes: Node[], edges: Edge[]) {
  const components = getConnectedComponents(nodes, edges);
  const positions = new Map<string, { x: number; y: number }>();
  const componentGapY = 140;
  let currentOffsetY = 0;

  for (const component of components) {
    const componentNodes = nodes.filter((node) => component.includes(node.id));
    const componentEdges = edges.filter((edge) => component.includes(edge.source) && component.includes(edge.target));
    const layout = await getLayoutByDagre(componentNodes, componentEdges);
    const wrapped = wrapDenseLayers(layout);
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    wrapped.forEach((position, nodeId) => {
      const info = layout.get(nodeId);
      if (!info)
        return;
      minY = Math.min(minY, position.y);
      maxY = Math.max(maxY, position.y + info.height);
    });

    wrapped.forEach((position, nodeId) => {
      positions.set(nodeId, {
        x: position.x,
        y: position.y - minY + currentOffsetY,
      });
    });

    currentOffsetY += (maxY - minY) + componentGapY;
  }

  return positions;
}

function organizeNodes(nodes: Node[], positions: Map<string, { x: number; y: number }>) {
  return structuredClone(nodes).map((node) => {
    const position = positions.get(node.id);
    if (!position)
      return node;

    return {
      ...node,
      position,
    };
  });
}

export const useWorkflowOrganize = ({
  canOrganize,
  setNodes,
  onBeforeOrganize,
  onAfterOrganize,
}: UseWorkflowOrganizeOptions) => {
  const store = useStoreApi();
  const reactflow = useReactFlow();

  const handleLayout = useCallback(async () => {
    if (!canOrganize())
      return;

    onBeforeOrganize?.();

    const { getNodes, edges } = store.getState();
    const nodes = getNodes();
    const positions = await getOrganizedPositions(nodes, edges);
    const nextNodes = organizeNodes(nodes, positions);

    setNodes(nextNodes);
    requestAnimationFrame(() => {
      void Promise.resolve(
        reactflow.fitView({
          padding: 0.2,
          duration: 250,
        }),
      ).then(() => {
        requestAnimationFrame(() => {
          onAfterOrganize?.(nextNodes);
        });
      });
    });
  }, [canOrganize, onBeforeOrganize, store, setNodes, reactflow, onAfterOrganize]);

  return {
    handleLayout,
  };
};
