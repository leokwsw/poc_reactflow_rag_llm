import {NextResponse} from "next/server";
import type {WorkflowDataType} from "@/app/components/workflow/types";
import {getWorkflowById, updateWorkflowGraph} from "@/app/workflow/data";

export const runtime = "nodejs";

type WorkflowRouteContext = {
  params: Promise<{
    workflowId: string;
  }>;
};

export async function GET(_request: Request, context: WorkflowRouteContext) {
  const {workflowId} = await context.params;
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    return NextResponse.json({error: "Workflow not found."}, {status: 404});
  }
  return NextResponse.json({workflow});
}

export async function PUT(request: Request, context: WorkflowRouteContext) {
  const {workflowId} = await context.params;
  const body = await request.json().catch(() => null) as {
    graph?: unknown;
    title?: unknown;
    description?: unknown;
  } | null;

  if (!body || !body.graph || typeof body.graph !== "object") {
    return NextResponse.json({error: "graph is required."}, {status: 400});
  }

  const workflow = await updateWorkflowGraph(
    workflowId,
    body.graph as WorkflowDataType,
    {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
    },
  );

  if (!workflow) {
    return NextResponse.json({error: "Workflow not found."}, {status: 404});
  }

  return NextResponse.json({workflow});
}
