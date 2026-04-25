import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type TemplateTransformNodeData = {
  template?: string;
};

export async function executeTemplateTransformNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as TemplateTransformNodeData;
  const rendered = interpolateTemplate(data.template || "{{#sys.query#}}", context);

  return {
    output: {
      output: rendered,
      text: rendered,
    },
    detail: `chars=${rendered.length}`,
  };
}
