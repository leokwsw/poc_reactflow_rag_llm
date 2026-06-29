import ToolsClient from "@/app/tools/tools-client";
import {listTools} from "@/app/tools/data";

export default async function ToolsPage() {
  const tools = await listTools();
  return <ToolsClient initialTools={tools} />;
}

