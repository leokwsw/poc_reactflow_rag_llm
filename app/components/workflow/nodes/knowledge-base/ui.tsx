"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type KnowledgeBaseNodeData = {
  label?: string;
  indexingTechnique?: string;
  retrievalSearchMethod?: string;
};

export default function KnowledgeBaseNode({ data }: NodeProps<KnowledgeBaseNodeData>) {
  return (
    <BaseNode title={data.label || "Knowledge Base"} tone="indigo" hasTarget hasSource>
      <div className="flex items-center rounded-md bg-zinc-100 px-2 py-1">
        <span className="mr-2 shrink-0 text-[10px] font-semibold uppercase text-zinc-500">Index Mode</span>
        <span className="grow truncate text-right text-xs text-zinc-700">
          {data.indexingTechnique || "high_quality"}
        </span>
      </div>
      <div className="flex items-center rounded-md bg-zinc-100 px-2 py-1">
        <span className="mr-2 shrink-0 text-[10px] font-semibold uppercase text-zinc-500">Retrieval</span>
        <span className="grow truncate text-right text-xs text-zinc-700">
          {data.retrievalSearchMethod || "semantic_search"}
        </span>
      </div>
    </BaseNode>
  );
}
