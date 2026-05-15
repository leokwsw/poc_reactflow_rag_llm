import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type TemplateNodeData = {
  input?: string;
};

export async function executeTemplateNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as TemplateNodeData;
  const text = interpolateTemplate(data.input || "{{#sys.query#}}", context);

  return {
    output: {
      text,
    },
    detail: "template-node",
  };
}
