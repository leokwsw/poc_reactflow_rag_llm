import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {resolveExpression} from "@/app/components/workflow/nodes/execution-utils";
import {interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";

type LogicalOperator = "and" | "or";
type ComparisonOperator = "includes" | "not_includes" | "starts_with" | "ends_with" | "is" | "is_not" | "is_empty" | "is_not_empty";

type IfElseCondition = {
  id?: string;
  left?: string;
  operator?: ComparisonOperator;
  right?: string;
};

type IfElseCase = {
  id: string;
  label: string;
  logical_operator?: LogicalOperator;
  conditions?: Array<IfElseCondition | string>;
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
  if (value === "null") return null;
  return value;
}

function resolveOperand(operand: string, context: NodeExecutionContext): unknown {
  const trimmed = interpolateTemplate(operand.trim(), context).trim();

  if (trimmed.endsWith(" count")) {
    const baseValue = resolveOperand(trimmed.slice(0, -6), context);
    if (Array.isArray(baseValue) || typeof baseValue === "string") {
      return baseValue.length;
    }
    return 0;
  }

  if (/^['"].*['"]$/.test(trimmed) || /^-?\d+(\.\d+)?$/.test(trimmed) || ["true", "false", "null"].includes(trimmed)) {
    return parseLiteral(trimmed);
  }

  if (trimmed === "query") return context.input.query;
  if (trimmed === "files") return context.input.files;

  const directOutput = context.nodeOutputs[trimmed];
  if (directOutput) return directOutput;

  const resolved = resolveExpression(trimmed, context.nodeOutputs, context.aliasMap);
  return resolved === undefined ? trimmed : resolved;
}

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }
  return false;
}

function valueIncludes(left: unknown, right: unknown) {
  const needle = String(right ?? "");
  if (typeof left === "string") {
    return left.includes(needle);
  }
  if (Array.isArray(left)) {
    return left.some((item) => String(item).includes(needle));
  }
  return String(left ?? "").includes(needle);
}

function valuesAreEqual(left: unknown, right: unknown) {
  if (typeof left === "number" || typeof right === "number") {
    return Number(left) === Number(right);
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return Boolean(left) === Boolean(right);
  }
  return String(left ?? "") === String(right ?? "");
}

function evaluateStructuredCondition(condition: IfElseCondition, context: NodeExecutionContext) {
  const operator = condition.operator ?? "includes";
  const left = resolveOperand(condition.left || "", context);
  const right = operator === "is_empty" || operator === "is_not_empty"
    ? ""
    : resolveOperand(condition.right || "", context);

  switch (operator) {
    case "includes":
      return valueIncludes(left, right);
    case "not_includes":
      return !valueIncludes(left, right);
    case "starts_with":
      return String(left ?? "").startsWith(String(right ?? ""));
    case "ends_with":
      return String(left ?? "").endsWith(String(right ?? ""));
    case "is":
      return valuesAreEqual(left, right);
    case "is_not":
      return !valuesAreEqual(left, right);
    case "is_empty":
      return isEmptyValue(left);
    case "is_not_empty":
      return !isEmptyValue(left);
    default:
      return false;
  }
}

function evaluateLegacyCondition(condition: string, context: NodeExecutionContext) {
  const normalized = condition.trim();

  const emptyMatch = normalized.match(/^(.+?)\s+(is empty|empty|is not empty|not empty)$/i);
  if (emptyMatch) {
    const left = resolveOperand(emptyMatch[1], context);
    const operator = emptyMatch[2].toLowerCase();
    return operator === "is empty" || operator === "empty" ? isEmptyValue(left) : !isEmptyValue(left);
  }

  const textMatch = normalized.match(/^(.+?)\s+(contains|includes|including|not contains|not includes|not including|starts with|start with|ends with|end with)\s+(.+)$/i);
  if (textMatch) {
    const left = resolveOperand(textMatch[1], context);
    const right = resolveOperand(textMatch[3], context);
    const operator = textMatch[2].toLowerCase();

    if (operator === "contains" || operator === "includes" || operator === "including") {
      return valueIncludes(left, right);
    }
    if (operator === "not contains" || operator === "not includes" || operator === "not including") {
      return !valueIncludes(left, right);
    }
    if (operator === "starts with" || operator === "start with") {
      return String(left ?? "").startsWith(String(right ?? ""));
    }
    return String(left ?? "").endsWith(String(right ?? ""));
  }

  const compareMatch = normalized.match(/^(.+?)\s*(==|!=|>=|<=|>|<|is not|is)\s*(.+)$/i);
  if (compareMatch) {
    const left = resolveOperand(compareMatch[1], context);
    const right = resolveOperand(compareMatch[3], context);
    const operator = compareMatch[2].toLowerCase();

    switch (operator) {
      case "==":
      case "is":
        return valuesAreEqual(left, right);
      case "!=":
      case "is not":
        return !valuesAreEqual(left, right);
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

function evaluateCondition(condition: IfElseCondition | string, context: NodeExecutionContext) {
  if (typeof condition === "string") {
    return evaluateLegacyCondition(condition, context);
  }

  return evaluateStructuredCondition(condition, context);
}

function describeCondition(condition: IfElseCondition | string) {
  if (typeof condition === "string") {
    return condition;
  }

  const operator = condition.operator ?? "includes";
  if (operator === "is_empty" || operator === "is_not_empty") {
    return `${condition.left ?? ""} ${operator}`;
  }
  return `${condition.left ?? ""} ${operator} ${condition.right ?? ""}`;
}

export async function executeIfElseNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as IfElseNodeData;
  const cases = data.cases && data.cases.length > 0
    ? data.cases
    : [{
      id: "if",
      label: "IF",
      logical_operator: "and" as const,
      conditions: [{left: "query", operator: "is_not_empty" as const, right: ""}],
    }];

  for (const branch of cases) {
    const conditions = branch.conditions ?? [];
    const results = conditions.map((condition) => evaluateCondition(condition, context));
    const matched = conditions.length > 0 && (
      (branch.logical_operator ?? "and") === "or"
        ? results.some(Boolean)
        : results.every(Boolean)
    );

    if (matched) {
      return {
        output: {
          selectedBranchId: branch.id,
          selectedBranchLabel: branch.label,
          logicalOperator: branch.logical_operator ?? "and",
          matchedConditions: conditions.map(describeCondition),
          conditionResults: results,
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
      conditionResults: [],
    },
    detail: "branch=ELSE",
    selectedSourceHandles: ["else"],
  };
}
