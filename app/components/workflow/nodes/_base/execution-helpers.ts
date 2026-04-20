import type { NodeExecutionContext } from "@/app/components/workflow/nodes/execution-types";
import { getIncomingEdges, resolveExpression } from "@/app/components/workflow/nodes/execution-utils";

export function getPrimaryParentOutput(context: NodeExecutionContext) {
  const incomingEdges = getIncomingEdges(context.node.id, context.edges);
  const parentId = incomingEdges[0]?.source;
  return parentId ? context.nodeOutputs[parentId] : undefined;
}

export function interpolateTemplate(template: string, context: NodeExecutionContext) {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawExpression: string) => {
    const expression = rawExpression.trim();
    if (expression === "query" || expression === "sys.query")
      return context.input.query;
    if (expression === "files" || expression === "sys.files")
      return JSON.stringify(context.input.files);

    const resolved = resolveExpression(expression, context.nodeOutputs, context.aliasMap);
    if (resolved === null || resolved === undefined)
      return "";
    if (typeof resolved === "string")
      return resolved;
    return JSON.stringify(resolved);
  });
}

export function getInputValue(context: NodeExecutionContext, selector?: string) {
  if (!selector)
    return getPrimaryParentOutput(context);
  if (selector === "query" || selector === "sys.query")
    return context.input.query;
  if (selector === "files" || selector === "sys.files")
    return context.input.files;
  return resolveExpression(selector, context.nodeOutputs, context.aliasMap);
}

export function toRecord(value: unknown, fallbackKey = "value"): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as Record<string, unknown>;
  return { [fallbackKey]: value };
}
