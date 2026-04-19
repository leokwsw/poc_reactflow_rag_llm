"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type KnowledgeRetrievalNodeData = {
  label?: string;
  datasets?: Array<{
    id: string;
    name: string;
  }>;
};

export default function KnowledgeRetrievalNode({ data }: NodeProps<KnowledgeRetrievalNodeData>) {
  const datasets = data.datasets ?? [];

  return (
    <BaseNode title={data.label || "Knowledge Retrieval"} tone="indigo" hasTarget hasSource>
      {datasets.length === 0 ? (
        <p className="text-xs text-zinc-500">No datasets selected</p>
      ) : (
        datasets.map((dataset) => (
          <div key={dataset.id} className="flex items-center rounded-md bg-zinc-100 px-2 py-1">
            <span className="w-0 grow truncate text-xs text-zinc-700">{dataset.name}</span>
          </div>
        ))
      )}
    </BaseNode>
  );
}
