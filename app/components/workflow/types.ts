import type {Edge, Node} from "reactflow";

export type WorkflowDataType = {
  nodes: Node[],
  edges: Edge[],
  readOnly: boolean,
  viewport: { x: number, y: number, zoom: number }
}
