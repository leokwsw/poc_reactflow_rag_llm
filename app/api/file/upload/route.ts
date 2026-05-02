import path from "node:path";
import {NextResponse} from "next/server";
import {allowedExtensions, maxFileSize} from "@/app/api/file/upload-limits";
import {saveUpload} from "@/app/api/file/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const entry = formData.get("file");

  if (!(entry instanceof File) || entry.size === 0) {
    return NextResponse.json({error: "Expected form-data field \"file\" with a non-empty file."}, {status: 400});
  }

  const extension = path.extname(entry.name).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({error: `${entry.name} is not an accepted file type.`}, {status: 400});
  }

  if (entry.size > maxFileSize) {
    return NextResponse.json({error: `File is larger than ${maxFileSize} bytes.`}, {status: 400});
  }

  const meta = await saveUpload(entry);
  return NextResponse.json({
    id: meta.id,
    file_name: meta.file_name,
    file_size: meta.file_size,
    mime: meta.mime,
  });
}
