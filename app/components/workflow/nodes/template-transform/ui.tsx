"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";

type TemplateTransformNodeData = {
  label?: string;
  template?: string;
};

export default function TemplateTransformNode({ data }: NodeProps<TemplateTransformNodeData>) {
  return (
    <BaseNode title={data.label || "Template Transform"} subtitle="Render a text template from variables" tone="zinc" hasTarget hasSource>
      <NodeSection label="Template">
        <pre className="line-clamp-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-2 text-xs text-zinc-700">
          {data.template || "Hello {{query}}"}
        </pre>
      </NodeSection>
    </BaseNode>
  );
}

