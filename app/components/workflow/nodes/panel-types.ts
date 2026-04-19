"use client";

import type { Node } from "reactflow";

export type NodePanelProps = {
  node: Node;
  patchNodeData: (nextData: Record<string, unknown>) => void;
};
