import PlaygroundClient from "@/app/playground/playground-client";
import type {WorkflowRecord} from "@/app/types/domain";
import {backendFetch} from "@/app/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const {workflows} = await backendFetch<{workflows: WorkflowRecord[]}>("/workflows");
  return <PlaygroundClient workflows={workflows} />;
}
