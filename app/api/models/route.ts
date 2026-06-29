import {NextResponse} from "next/server";
import {listModelConfigs} from "@/app/model/data";

export const runtime = "nodejs";

export async function GET() {
  const models = await listModelConfigs();
  return NextResponse.json({models});
}
