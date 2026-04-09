 "use client";

 import {useCallback, useState} from "react";
import type {Node} from "reactflow";
import Workflow from "@/app/components/workflow";
import {defaultData} from "@/app/components/workflow/default-data";
import type {WorkflowDataType} from "@/app/components/workflow/types";

 export default function Home() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeDataPatch, setNodeDataPatch] = useState<{
    id: string;
    data: Record<string, any>;
    nonce: number;
  } | null>(null);

  const patchSelectedNodeData = useCallback(
    (nextData: Record<string, any>) => {
      if (!selectedNode) return;
      setSelectedNode({
        ...selectedNode,
        data: {
          ...selectedNode.data,
          ...nextData,
        },
      });
      setNodeDataPatch({
        id: selectedNode.id,
        data: nextData,
        nonce: Date.now(),
      });
    },
    [selectedNode],
  );

  const [data, setData] = useState(defaultData);

  const handleWorkflowDataChange = useCallback((next: WorkflowDataType) => {
    setData(next);
  }, []);

  return (
    <div className="flex h-screen w-full">
      <div className="min-w-0 flex-1">
        <Workflow
          initData={data}
          onNodeSelect={setSelectedNode}
          nodeDataPatch={nodeDataPatch}
          onDataChange={handleWorkflowDataChange}
        />
      </div>
      <aside className="w-80 border-l border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Node Settings</h2>

        {!selectedNode && <p className="text-sm text-zinc-500">Select a node to configure.</p>}

        {selectedNode?.data.type === "start" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Query Variable</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={(selectedNode.data as any).variables?.[0]?.name ?? "query"}
                onChange={(event) => {
                  const variables = [...(((selectedNode.data as any).variables ?? []) as any[])];
                  variables[0] = {
                    ...(variables[0] ?? {}),
                    name: event.target.value,
                    required: true,
                    type: variables[0]?.type ?? "string",
                  };
                  patchSelectedNodeData({ variables });
                }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Files Variable</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={(selectedNode.data as any).variables?.[1]?.name ?? "files"}
                onChange={(event) => {
                  const variables = [...(((selectedNode.data as any).variables ?? []) as any[])];
                  variables[1] = {
                    ...(variables[1] ?? {}),
                    name: event.target.value,
                    type: variables[1]?.type ?? "file[]",
                  };
                  patchSelectedNodeData({ variables });
                }}
              />
            </label>
          </div>
        )}

        {selectedNode?.data.type === "llm" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Provider</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={((selectedNode.data as any).provider ?? "") as string}
                onChange={(event) => patchSelectedNodeData({ provider: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Model</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={((selectedNode.data as any).model ?? "") as string}
                onChange={(event) => patchSelectedNodeData({ model: event.target.value })}
              />
            </label>
          </div>
        )}

        {selectedNode && !["start", "llm"].includes(selectedNode.data.type ?? "") && (
          <p className="text-sm text-zinc-500">No configurable fields for this node type yet.</p>
        )}

        <br/>
        <br/>
        {JSON.stringify(data)}
      </aside>
    </div>
  );
}
