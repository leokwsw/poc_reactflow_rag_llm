import {NextResponse} from "next/server";
import {listTools} from "@/app/tools/data";

export const runtime = "nodejs";

const errorResponse = (error: unknown, status = 400) =>
  NextResponse.json(
    {error: error instanceof Error ? error.message : typeof error === "string" ? error : "Tool request failed."},
    {status},
  );

export async function GET() {
  const tools = await listTools();
  return NextResponse.json({tools});
}

export async function POST() {
  return errorResponse("Manual tool creation is disabled. Import OpenAPI Swagger JSON/YAML instead.", 405);
}
