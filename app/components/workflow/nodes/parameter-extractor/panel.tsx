"use client";

import { PanelButton, PanelCard, PanelField, PanelInlineActions, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type Parameter = {
  name: string;
  type?: string;
};

type ParameterExtractorNodeData = {
  label?: string;
  parameters?: Parameter[];
};

export default function ParameterExtractorPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as ParameterExtractorNodeData;
  const parameters = data.parameters ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Parameter Extractor"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      {parameters.map((parameter, index) => (
        <PanelCard key={`${parameter.name}-${index}`}>
          <PanelInlineActions>
            <PanelButton
              className="w-auto border-0 p-0"
              danger
              onClick={() => patchNodeData({ parameters: parameters.filter((_, itemIndex) => itemIndex !== index) })}
            >
              Remove
            </PanelButton>
          </PanelInlineActions>
          <PanelInput
            placeholder="Name"
            value={parameter.name}
            onChange={(event) =>
              patchNodeData({
                parameters: parameters.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)),
              })
            }
          />
          <PanelInput
            placeholder="Type"
            value={parameter.type ?? ""}
            onChange={(event) =>
              patchNodeData({
                parameters: parameters.map((item, itemIndex) => (itemIndex === index ? { ...item, type: event.target.value } : item)),
              })
            }
          />
        </PanelCard>
      ))}
      <PanelButton onClick={() => patchNodeData({ parameters: [...parameters, { name: "", type: "string" }] })}>Add Parameter</PanelButton>
    </div>
  );
}
