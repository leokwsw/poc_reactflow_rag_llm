import type { NodeExecutionContext, NodeExecutionResult, WorkflowFile } from "@/app/components/workflow/nodes/execution-types";
import { getInputValue } from "@/app/components/workflow/nodes/_base/execution-helpers";

type DocumentExtractorNodeData = {
  variable_selector?: string[];
  sourceSelector?: string;
  mode?: string;
};

function normalizeFiles(value: unknown, fallback: WorkflowFile[]): WorkflowFile[] {
  if (Array.isArray(value))
    return value.filter((item): item is WorkflowFile => !!item && typeof item === "object" && "name" in item);

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.files))
      return record.files.filter((item): item is WorkflowFile => !!item && typeof item === "object" && "name" in item);
  }

  return fallback;
}

export async function executeDocumentExtractorNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as DocumentExtractorNodeData;
  const selector = Array.isArray(data.variable_selector) && data.variable_selector.length > 0
    ? data.variable_selector.join(".")
    : data.sourceSelector || "files";
  const sourceValue = getInputValue(context, selector);
  const files = normalizeFiles(sourceValue, context.input.files);
  const documents = files.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
    text: file.text ?? "",
  }));
  const text = documents.map((doc) => doc.text).filter(Boolean).join("\n\n");

  return {
    output: {
      documents,
      text,
      count: documents.length,
      mode: data.mode || "text",
    },
    detail: `documents=${documents.length}`,
  };
}
