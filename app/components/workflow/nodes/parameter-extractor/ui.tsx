"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type ExtractedParam = {
  name: string;
  type?: string;
};

type ParameterExtractorNodeData = {
  label?: string;
  parameters?: ExtractedParam[];
};

export default function ParameterExtractorNode({ data }: NodeProps<ParameterExtractorNodeData>) {
  const parameters = data.parameters ?? [];

  return (
    <BaseNode title={data.label || "Parameter Extractor"} tone="indigo" hasTarget hasSource>
      <NodeSection label="Parameters">
        {parameters.length === 0 ? <NodeToken muted>No parameters configured</NodeToken> : (
          <div className="space-y-1.5">
            {parameters.map((param) => (
              <NodeToken key={param.name}>{param.name}{param.type ? ` : ${param.type}` : ""}</NodeToken>
            ))}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}
