import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { resolveExpression } from "@/app/components/workflow/nodes/execution-utils";

type IfElseCase = {
  id: string;
  label: string;
  conditions?: string[];
};

type IfElseNodeData = {
  label?: string;
  cases?: IfElseCase[];
};

function parseLiteral(raw: string) {
  const value = raw.trim();
  if (/^['"].*['"]$/.test(value)) return value.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function resolveOperand(
  operand: string,
  context: NodeExecutionContext,
): unknown {
  const trimmed = operand.trim();

  if (trimmed.endsWith(" count")) {
    const baseValue = resolveOperand(trimmed.slice(0, -6), context);
    if (Array.isArray(baseValue) || typeof baseValue === "string") {
      return baseValue.length;
    }
    return 0;
  }

  if (/^['"].*['"]$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed) || trimmed === "true" || trimmed === "false") {
    return parseLiteral(trimmed);
  }

  if (trimmed === "query") return context.input.query;
  if (trimmed === "files") return context.input.files;

  const directOutput = context.nodeOutputs[trimmed];
  if (directOutput) return directOutput;

  return resolveExpression(trimmed, context.nodeOutputs, context.aliasMap);
}

function evaluateCondition(condition: string, context: NodeExecutionContext) {
  const normalized = condition.trim();

  const containsMatch = normalized.match(/^(.+?)\s+contains\s+(.+)$/i);
  if (containsMatch) {
    const left = resolveOperand(containsMatch[1], context);
    const right = String(resolveOperand(containsMatch[2], context) ?? "");

    if (typeof left === "string") return left.includes(right);
    if (Array.isArray(left)) return left.some((item) => String(item).includes(right));
    return false;
  }

  const compareMatch = normalized.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (compareMatch) {
    const left = resolveOperand(compareMatch[1], context);
    const right = resolveOperand(compareMatch[3], context);
    const operator = compareMatch[2];

    switch (operator) {
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return Number(left) > Number(right);
      case "<":
        return Number(left) < Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<=":
        return Number(left) <= Number(right);
      default:
        return false;
    }
  }

  const truthyValue = resolveOperand(normalized, context);
  return Boolean(truthyValue);
}

export async function executeIfElseNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as IfElseNodeData;
  const cases = data.cases ?? [];

  for (const branch of cases) {
    const conditions = branch.conditions ?? [];
    const matched = conditions.length > 0 && conditions.every((condition) => evaluateCondition(condition, context));

    if (matched) {
      return {
        output: {
          selectedBranchId: branch.id,
          selectedBranchLabel: branch.label,
          matchedConditions: conditions,
        },
        detail: `branch=${branch.label || branch.id}`,
        selectedSourceHandles: [branch.id],
      };
    }
  }

  return {
    output: {
      selectedBranchId: "else",
      selectedBranchLabel: "ELSE",
      matchedConditions: [],
    },
    detail: "branch=ELSE",
    selectedSourceHandles: ["else"],
  };
}
