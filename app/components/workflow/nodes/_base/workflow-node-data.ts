export type WorkflowNodeRunStatus = "idle" | "running" | "completed" | "error";

/** Fields present on every custom node `data` (canvas + graph JSON). */
export type WorkflowNodeDataBase = {
  label?: string;
  runStatus?: WorkflowNodeRunStatus;
};
