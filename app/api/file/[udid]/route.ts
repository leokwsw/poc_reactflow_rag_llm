import {NextResponse} from "next/server";
import {readBlob, readMeta} from "@/app/api/file/store";

export const runtime = "nodejs";

type RouteContext = {params: Promise<{udid: string}>};

export async function GET(_request: Request, context: RouteContext) {
  const {udid} = await context.params;

  if (!udid || udid.includes("/") || udid.includes("..")) {
    return NextResponse.json({error: "Invalid file id."}, {status: 400});
  }

  const meta = await readMeta(udid);
  if (!meta) {
    return NextResponse.json({error: "File not found."}, {status: 404});
  }

  const blob = await readBlob(udid);
  if (!blob) {
    return NextResponse.json({error: "File data missing."}, {status: 404});
  }

  const filenameStar = encodeURIComponent(meta.file_name);
  return new Response(new Uint8Array(blob), {
    headers: {
      "Content-Type": meta.mime,
      "Content-Length": String(blob.length),
      "Content-Disposition": `inline; filename*=UTF-8''${filenameStar}`,
    },
  });
}
