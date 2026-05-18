import {NextResponse} from "next/server";
import {listMcpServers} from "@/app/mcp/data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const servers = await listMcpServers();
    const tools = servers.flatMap((server) =>
      server.tools.map((tool) => ({
        id: `${server.server_identifier}:${tool.name}`,
        name: tool.name,
        description: tool.description ?? "",
        inputSchema: tool.inputSchema ?? {},
        server_id: server.id,
        server_name: server.name,
        server_identifier: server.server_identifier,
      })),
    );

    return NextResponse.json({tools});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load MCP tools.";
    return NextResponse.json({error: message}, {status: 500});
  }
}
