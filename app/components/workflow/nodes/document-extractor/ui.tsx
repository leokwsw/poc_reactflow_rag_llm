"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type DocumentExtractorNodeData = WorkflowNodeDataBase & {
  variable_selector?: string[];
  sourceSelector?: string;
  is_array_file?: boolean;
  mode?: string;
};

export default function DocumentExtractorNode({ data }: NodeProps<DocumentExtractorNodeData>) {
  const selector = Array.isArray(data.variable_selector) && data.variable_selector.length > 0
    ? data.variable_selector.join(".")
    : data.sourceSelector || "files";

  return (
    <BaseNode title={data.label || "Document Extractor"} tone="indigo" hasTarget hasSource>
      <NodeSection label="Source">
        <NodeToken>{selector}</NodeToken>
      </NodeSection>
      <NodeSection label="Mode">
        <NodeToken>{`${data.mode || "text"}${data.is_array_file ? "[]" : ""}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
