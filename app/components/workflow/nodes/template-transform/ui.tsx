"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type TemplateTransformNodeData = {
  label?: string;
  template?: string;
};

export default function TemplateTransformNode({ data }: NodeProps<TemplateTransformNodeData>) {
  const template = data.template || "Hello {{#sys.query#}}";
  const variableCount = (template.match(/\{\{\s*([^}]+?)\s*\}\}/g) ?? []).length;

  return (
    <BaseNode title={data.label || "Template Transform"} subtitle="Render a text template from variables" tone="zinc" hasTarget hasSource>
      <NodeSection label="Template">
        <NodeToken>{`${template.length} chars`}</NodeToken>
      </NodeSection>
      <NodeSection label="Variables">
        <NodeToken>{`${variableCount} reference${variableCount === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
