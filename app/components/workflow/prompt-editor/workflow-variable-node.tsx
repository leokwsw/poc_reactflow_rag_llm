"use client";

import type { ReactElement } from "react";
import type { LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import { DecoratorNode } from "lexical";
import { WorkflowVariableBadge } from "./workflow-variable-shared";

export type SerializedWorkflowVariableNode = Spread<
  {
    type: "workflow-variable";
    version: 1;
    expression: string;
    label: string;
  },
  SerializedLexicalNode
>;

export class WorkflowVariableNode extends DecoratorNode<ReactElement> {
  __expression: string;
  __label: string;

  static getType(): string {
    return "workflow-variable";
  }

  static clone(node: WorkflowVariableNode): WorkflowVariableNode {
    return new WorkflowVariableNode(node.__expression, node.__label, node.__key);
  }

  static importJSON(serializedNode: SerializedWorkflowVariableNode): WorkflowVariableNode {
    return $createWorkflowVariableNode(serializedNode.expression, serializedNode.label);
  }

  constructor(expression: string, label: string, key?: NodeKey) {
    super(key);
    this.__expression = expression;
    this.__label = label;
  }

  exportJSON(): SerializedWorkflowVariableNode {
    return {
      type: "workflow-variable",
      version: 1,
      expression: this.getExpression(),
      label: this.getLabel(),
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = "inline-flex items-center align-middle";
    return element;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  decorate(): ReactElement {
    return (
      <WorkflowVariableBadge
        expression={this.__expression}
        label={this.__label}
        className="text-xs"
      />
    );
  }

  getTextContent(): string {
    return `{{#${this.__expression}#}}`;
  }

  getExpression(): string {
    return this.getLatest().__expression;
  }

  getLabel(): string {
    return this.getLatest().__label;
  }

  setLabel(label: string) {
    const writable = this.getWritable();
    writable.__label = label;
  }
}

export function $createWorkflowVariableNode(expression: string, label: string): WorkflowVariableNode {
  return new WorkflowVariableNode(expression, label);
}

export function $isWorkflowVariableNode(
  node: LexicalNode | null | undefined,
): node is WorkflowVariableNode {
  return node instanceof WorkflowVariableNode;
}
