import {NextResponse} from "next/server";
import {importOpenApiTools} from "@/app/tools/openapi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await importOpenApiTools(body);
    return NextResponse.json(result, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "OpenAPI import failed."},
      {status: 400},
    );
  }
}

