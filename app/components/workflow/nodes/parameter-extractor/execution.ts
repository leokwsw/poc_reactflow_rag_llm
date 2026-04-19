import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type Parameter = {
  name: string;
  type?: string;
};

type ParameterExtractorNodeData = {
  parameters?: Parameter[];
};

function extractValue(query: string, name: string) {
  const patterns = [
    new RegExp(`${name}\\s*[:=]\\s*([^,;\\n]+)`, "i"),
    new RegExp(`${name}\\s+is\\s+([^,;\\n]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1])
      return match[1].trim();
  }

  return null;
}

export async function executeParameterExtractorNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as ParameterExtractorNodeData;
  const parameters = data.parameters ?? [];
  const output: Record<string, unknown> = {};

  parameters.forEach((parameter) => {
    output[parameter.name] = extractValue(context.input.query, parameter.name);
  });

  return {
    output,
    detail: `params=${parameters.length}`,
  };
}

