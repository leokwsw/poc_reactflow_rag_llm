import {NextResponse} from "next/server";
import {createTool, listTools} from "@/app/tools/data";

export const runtime = "nodejs";

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json(
    {error: error instanceof Error ? error.message : "Tool request failed."},
    {status},
  );

export async function GET() {
  const tools = await listTools();
  return NextResponse.json({tools});
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tool = await createTool(body);
    return NextResponse.json({tool}, {status: 201});
  } catch (error) {
    return errorResponse(error);
  }
}

