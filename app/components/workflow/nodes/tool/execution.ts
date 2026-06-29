import {getInputValue, interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";
import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {executeTool, getToolById} from "@/app/tools/data";

type InputMappingRow = {
  enabled?: boolean;
  name?: string;
  value?: string;
};

type ToolNodeData = {
  tool_id?: string;
  input_mapping?: InputMappingRow[];
};

const renderMappingValue = (value: string | undefined, context: NodeExecutionContext) => {
  const raw = value ?? "";
  const wrapped = raw.match(/^\{\{#\s*([^#}]+?)\s*#\}\}$/);
  if (wrapped) {
    return getInputValue(context, wrapped[1].trim());
  }
  return interpolateTemplate(raw, context);
};

function buildArgs(data: ToolNodeData, context: NodeExecutionContext) {
  const args: Record<string, unknown> = {};
  for (const row of data.input_mapping ?? []) {
    if (row.enabled === false || !row.name?.trim()) continue;
    args[row.name.trim()] = renderMappingValue(row.value, context);
  }
  return args;
}

export async function executeToolNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as ToolNodeData;
  const toolId = data.tool_id?.trim();
  if (!toolId) {
    throw new Error(`Tool node "${context.node.id}" has no selected tool.`);
  }

  const tool = await getToolById(toolId);
  if (!tool) {
    throw new Error(`Tool "${toolId}" was not found.`);
  }

  const args = buildArgs(data, context);
  const result = await executeTool(tool, {arg: args, input: context.input, nodeOutputs: context.nodeOutputs});

  return {
    output: {
      tool_id: tool.id,
      tool_name: tool.name,
      args,
      ...result,
    },
    detail: `${tool.name} ${result.status_code}`,
    traceInput: {
      tool_id: tool.id,
      tool_name: tool.name,
      args,
      method: tool.method,
      url: tool.url,
    },
    traceOutput: result,
  };
}

