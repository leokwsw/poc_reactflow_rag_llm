import {NextResponse} from "next/server";
import {getToolById} from "@/app/tools/data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    toolId: string;
  }>;
};

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json(
    {error: error instanceof Error ? error.message : typeof error === "string" ? error : "Tool request failed."},
    {status},
  );

export async function GET(_: Request, context: RouteContext) {
  const {toolId} = await context.params;
  const tool = await getToolById(toolId);
  if (!tool) {
    return NextResponse.json({error: "Tool not found."}, {status: 404});
  }
  return NextResponse.json({tool});
}

export async function PUT() {
  return errorResponse("Manual tool updates are disabled. Re-import OpenAPI Swagger JSON/YAML instead.", 405);
}

export async function DELETE() {
  return errorResponse("Deleting a single generated tool is disabled. Delete the OpenAPI import group instead.", 405);
}
