export const MODEL_PROFILES = [
  { id: "@ezchat/lite", label: "EZChat Lite" },
  { id: "@ezchat/core", label: "EZChat Core" },
  { id: "@ezchat/pro", label: "EZChat Pro" },
] as const;

export type ModelProfileId = (typeof MODEL_PROFILES)[number]["id"];

const modelProfileIdSet = new Set<string>(MODEL_PROFILES.map((profile) => profile.id));

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && modelProfileIdSet.has(value);
}

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/lite";
