"use client";

import { CHAT_MODEL_PROFILES, DEFAULT_MODEL_PROFILE_ID, isModelProfileId } from "@/app/model/profiles";
import type { ModelProfileId } from "@/app/model/profiles";

type ModelProfileSelectProps = {
  value?: string;
  onChange: (value: ModelProfileId) => void;
};

export default function ModelProfileSelect({ value, onChange }: ModelProfileSelectProps) {
  const selectedModel = isModelProfileId(value) ? value : DEFAULT_MODEL_PROFILE_ID;

  return (
    <select
      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      value={selectedModel}
      onChange={(event) => {
        if (isModelProfileId(event.target.value)) {
          onChange(event.target.value);
        }
      }}
    >
      {CHAT_MODEL_PROFILES.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.id}
        </option>
      ))}
    </select>
  );
}
