import {NextResponse} from "next/server";
import {callMcpTool, inspectMcpTools} from "@/app/mcp/data";

export const runtime = "nodejs";

const parseHeaders = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[0].trim().length > 0)
      .map(([key, headerValue]) => [key.trim(), headerValue]),
  );
};

const parseArguments = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    action?: unknown;
    serverUrl?: unknown;
    headers?: unknown;
    toolName?: unknown;
    arguments?: unknown;
  };

  const action = typeof body.action === "string" ? body.action : "";
  const serverUrl = typeof body.serverUrl === "string" ? body.serverUrl.trim() : "";
  const headers = parseHeaders(body.headers);

  if (!serverUrl) {
    return NextResponse.json({error: "MCP server URL is required."}, {status: 400});
  }

  try {
    if (action === "tools/list") {
      const tools = await inspectMcpTools(serverUrl, headers);
      return NextResponse.json({tools});
    }

    if (action === "tools/call") {
      const toolName = typeof body.toolName === "string" ? body.toolName.trim() : "";
      if (!toolName) {
        return NextResponse.json({error: "Tool name is required."}, {status: 400});
      }

      const result = await callMcpTool({
        serverUrl,
        headers,
        toolName,
        arguments: parseArguments(body.arguments),
      });
      return NextResponse.json({result});
    }

    return NextResponse.json({error: "Unknown MCP inspector action."}, {status: 400});
  } catch (error) {
    const message = error instanceof Error ? error.message : "MCP request failed.";
    return NextResponse.json({error: message}, {status: 500});
  }
}
