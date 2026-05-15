import PlaygroundClient from "@/app/playground/playground-client";
import {listWorkflows} from "@/app/workflow/data";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const workflows = await listWorkflows();
  return <PlaygroundClient workflows={workflows} />;
}
