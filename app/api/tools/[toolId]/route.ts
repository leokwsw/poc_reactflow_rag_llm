import {NextResponse} from "next/server";
import {deleteTool, getToolById, updateTool} from "@/app/tools/data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    toolId: string;
  }>;
};

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json(
    {error: error instanceof Error ? error.message : "Tool request failed."},
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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const {toolId} = await context.params;
    const body = await request.json();
    const tool = await updateTool(toolId, body);
    if (!tool) {
      return NextResponse.json({error: "Tool not found."}, {status: 404});
    }
    return NextResponse.json({tool});
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const {toolId} = await context.params;
    await deleteTool(toolId);
    return NextResponse.json({success: true});
  } catch (error) {
    return errorResponse(error);
  }
}

