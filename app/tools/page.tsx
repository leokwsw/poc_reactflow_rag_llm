import ToolsClient from "@/app/tools/tools-client";
import type {ToolRecord} from "@/app/types/domain";
import {backendFetch} from "@/app/lib/backend-api";

export default async function ToolsPage() {
  const {tools} = await backendFetch<{tools: ToolRecord[]}>("/tools");
  return <ToolsClient initialTools={tools} />;
}
