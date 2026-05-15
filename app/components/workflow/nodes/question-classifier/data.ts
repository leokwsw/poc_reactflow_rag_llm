import type {WorkflowNodeDataBase} from "@/app/components/workflow/nodes/_base/workflow-node-data";

export type QuestionClass = {
  id: string;
  title: string;
  value: string;
};

export type QuestionClassifierNodeData = WorkflowNodeDataBase & {
  label?: string;
  model?: string;
  instruction?: string;
  classes?: QuestionClass[];
};
