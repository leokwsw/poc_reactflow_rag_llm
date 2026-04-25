"use client";

import type { Edge, Node } from "reactflow";

export type NodePanelProps = {
  node: Node;
  patchNodeData: (nextData: Record<string, unknown>) => void;
  allNodes?: Node[];
  allEdges?: Edge[];
};
