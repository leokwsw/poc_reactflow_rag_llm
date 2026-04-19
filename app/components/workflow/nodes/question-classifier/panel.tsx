"use client";

import { PanelButton, PanelCard, PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type QuestionClass = {
  id: string;
  name: string;
};

type QuestionClassifierNodeData = {
  label?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  instruction?: string;
  classes?: QuestionClass[];
};

export default function QuestionClassifierPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as QuestionClassifierNodeData;
  const classes = data.classes ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Question Classifier"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="API Base URL">
        <PanelInput value={data.apiBaseUrl ?? "https://api.openai.com/v1"} onChange={(event) => patchNodeData({ apiBaseUrl: event.target.value })} />
      </PanelField>
      <PanelField label="API Key">
        <PanelInput type="password" value={data.apiKey ?? ""} onChange={(event) => patchNodeData({ apiKey: event.target.value })} />
      </PanelField>
      <PanelField label="Model">
        <PanelInput value={data.model ?? ""} onChange={(event) => patchNodeData({ model: event.target.value })} />
      </PanelField>
      <PanelField label="Instruction">
        <PanelTextArea className="min-h-24" value={data.instruction ?? ""} onChange={(event) => patchNodeData({ instruction: event.target.value })} />
      </PanelField>

      <div className="space-y-3">
        {classes.map((classItem, index) => (
          <PanelCard key={classItem.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-700">Class {index + 1}</p>
              <PanelButton
                className="w-auto border-0 p-0"
                danger
                onClick={() => patchNodeData({ classes: classes.filter((item) => item.id !== classItem.id) })}
              >
                Remove
              </PanelButton>
            </div>
            <PanelField label="Class ID">
              <PanelInput
                value={classItem.id}
                onChange={(event) =>
                  patchNodeData({
                    classes: classes.map((item, itemIndex) => (itemIndex === index ? { ...item, id: event.target.value } : item)),
                  })
                }
              />
            </PanelField>
            <PanelField label="Class Name">
              <PanelInput
                value={classItem.name}
                onChange={(event) =>
                  patchNodeData({
                    classes: classes.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)),
                  })
                }
              />
            </PanelField>
          </PanelCard>
        ))}
      </div>

      <PanelButton
        onClick={() =>
          patchNodeData({
            classes: [
              ...classes,
              {
                id: `class_${Date.now()}`,
                name: `Class ${classes.length + 1}`,
              },
            ],
          })
        }
      >
        Add Class
      </PanelButton>
    </div>
  );
}
