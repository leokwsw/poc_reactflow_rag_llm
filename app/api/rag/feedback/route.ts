import {NextResponse} from "next/server";
import {saveRagFeedback} from "@/app/lib/rag-feedback";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({error: message}, {status: 400});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!body || typeof body !== "object") {
    return badRequest("Request body must be a JSON object.");
  }

  const input = body as Record<string, unknown>;
  const dataset_id = String(input.dataset_id ?? "").trim();
  const query = String(input.query ?? "").trim();
  const rating = input.rating === "negative" ? "negative" : input.rating === "positive" ? "positive" : "";

  if (!dataset_id) return badRequest("dataset_id is required.");
  if (!query) return badRequest("query is required.");
  if (!rating) return badRequest("rating must be positive or negative.");

  const result = await saveRagFeedback({
    dataset_id,
    chunk_id: typeof input.chunk_id === "string" ? input.chunk_id : undefined,
    query,
    rating,
    note: typeof input.note === "string" ? input.note : undefined,
  });

  return NextResponse.json({success: true, ...result});
}

