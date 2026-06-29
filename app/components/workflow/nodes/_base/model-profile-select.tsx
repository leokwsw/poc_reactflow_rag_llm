"use client";

import {useEffect, useMemo, useState} from "react";
import {DEFAULT_MODEL_PROFILE_ID, isModelProfileId} from "@/app/model/profiles";
import type {ModelConfig} from "@/app/model/data";
import type {ModelProfileId} from "@/app/model/profiles";

type ModelProfileSelectProps = {
  value?: string;
  onChange: (value: ModelProfileId) => void;
};

export default function ModelProfileSelect({value, onChange}: ModelProfileSelectProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loadError, setLoadError] = useState("");
  const selectedModel = isModelProfileId(value) ? value : DEFAULT_MODEL_PROFILE_ID;
  const llmModels = useMemo(() => models.filter((model) => model.model_type === "llm"), [models]);
  const hasSelectedModel = llmModels.some((model) => model.id === selectedModel);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/models");
        const payload = (await response.json()) as {models?: ModelConfig[]; error?: string};
        if (!response.ok) throw new Error(payload.error ?? `Failed to load models (${response.status}).`);
        if (!cancelled) {
          setModels(payload.models ?? []);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load models.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <select
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        value={selectedModel}
        onChange={(event) => {
          if (isModelProfileId(event.target.value)) {
            onChange(event.target.value);
          }
        }}
      >
        {!hasSelectedModel ? <option value={selectedModel}>{selectedModel}</option> : null}
        {llmModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>
      {loadError ? <p className="text-xs text-red-600">{loadError}</p> : null}
      {llmModels.length === 0 && !loadError ? (
        <p className="text-xs text-zinc-500">No dynamic LLM models configured yet.</p>
      ) : null}
    </div>
  );
}
