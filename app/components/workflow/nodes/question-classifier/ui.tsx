"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type QuestionClass = {
  id: string;
  name: string;
};

type QuestionClassifierNodeData = {
  label?: string;
  classes?: QuestionClass[];
};

export default function QuestionClassifierNode({ data }: NodeProps<QuestionClassifierNodeData>) {
  const classes = data.classes ?? [];

  return (
    <BaseNode title={data.label || "Question Classifier"} subtitle="Classify user intent into categories" tone="amber" hasTarget hasSource>
      <NodeSection label="Classes">
        {classes.length === 0 ? <NodeToken muted>No classes configured</NodeToken> : (
          <div className="space-y-1.5">
            {classes.map((item) => <NodeToken key={item.id}>{item.name}</NodeToken>)}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}

