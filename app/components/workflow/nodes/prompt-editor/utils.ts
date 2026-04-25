"use client";

import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot, $nodesOfType } from "lexical";
import { $createWorkflowVariableNode, WorkflowVariableNode } from "./workflow-variable-node";

export type WorkflowPromptVariableOption = {
  key: string;
  expression: string;
  label: string;
  typeLabel?: string;
};

export function normalizePromptValue(value?: string) {
  return (value ?? "").replace(/\r\n?/g, "\n");
}

export function buildVariableLabelMap(options: WorkflowPromptVariableOption[]) {
  return new Map(options.map((option) => [option.expression, option.label] as const));
}

export function serializeEditorText(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    return $getRoot().getChildren().map(node => node.getTextContent()).join("\n");
  });
}

export function setEditorValueFromString(
  editor: LexicalEditor,
  value: string,
  variableLabels: Map<string, string>,
) {
  const normalized = normalizePromptValue(value);

  editor.update(() => {
    const root = $getRoot();
    root.clear();

    const lines = normalized.split("\n");
    const safeLines = lines.length > 0 ? lines : [""];

    safeLines.forEach((line) => {
      const paragraph = $createParagraphNode();
      const matcher = /\{\{#\s*([^}]+?)\s*#\}\}/g;
      let lastIndex = 0;

      for (const match of line.matchAll(matcher)) {
        const fullMatch = match[0] ?? "";
        const expression = (match[1] ?? "").trim();
        const matchIndex = match.index ?? 0;

        if (matchIndex > lastIndex) {
          paragraph.append($createTextNode(line.slice(lastIndex, matchIndex)));
        }

        paragraph.append(
          $createWorkflowVariableNode(
            expression,
            variableLabels.get(expression) ?? expression,
          ),
        );
        lastIndex = matchIndex + fullMatch.length;
      }

      if (lastIndex < line.length) {
        paragraph.append($createTextNode(line.slice(lastIndex)));
      }

      if (paragraph.getChildrenSize() === 0) {
        paragraph.append($createTextNode(""));
      }

      root.append(paragraph);
    });

    if (root.getChildrenSize() === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      root.append(paragraph);
    }
  });
}

export function syncWorkflowVariableLabels(
  editor: LexicalEditor,
  variableLabels: Map<string, string>,
) {
  editor.update(() => {
    $nodesOfType(WorkflowVariableNode).forEach((node) => {
      const nextLabel = variableLabels.get(node.getExpression()) ?? node.getExpression();
      if (node.getLabel() !== nextLabel) {
        node.setLabel(nextLabel);
      }
    });
  });
}
