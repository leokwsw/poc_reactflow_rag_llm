import {NextResponse} from "next/server";
import {deleteToolsByImportId} from "@/app/tools/data";
import {importOpenApiTools} from "@/app/tools/openapi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json()
      : {spec_text: await request.text()};
    const result = await importOpenApiTools(body);
    return NextResponse.json(result, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "OpenAPI import failed."},
      {status: 400},
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {import_id?: unknown};
    const importId = typeof body.import_id === "string" ? body.import_id.trim() : "";
    if (!importId) {
      return NextResponse.json({error: "import_id is required."}, {status: 400});
    }
    await deleteToolsByImportId(importId);
    return NextResponse.json({success: true});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "OpenAPI tools delete failed."},
      {status: 400},
    );
  }
}
