import {NextResponse} from "next/server";
import {createWorkflow, listWorkflows} from "@/app/workflow/data";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({workflows: await listWorkflows()});
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {title?: unknown};
  const title = typeof body.title === "string" ? body.title : undefined;
  const workflow = await createWorkflow(title);
  return NextResponse.json({workflow, redirect_url: `/workflow/${workflow.id}`}, {status: 201});
}
