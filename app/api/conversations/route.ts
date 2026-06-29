import {NextResponse} from "next/server";
import {createConversation, listConversations} from "@/app/chat/data";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({conversations: await listConversations()});
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {workflow_id?: unknown; title?: unknown};
  const workflowId = typeof body.workflow_id === "string" ? body.workflow_id : "";
  if (!workflowId) {
    return NextResponse.json({error: "workflow_id is required."}, {status: 400});
  }

  try {
    const conversation = await createConversation({
      workflow_id: workflowId,
      title: typeof body.title === "string" ? body.title : undefined,
    });
    return NextResponse.json({conversation, redirect_url: `/chat/${conversation.id}`}, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {error: error instanceof Error ? error.message : "Could not create conversation."},
      {status: 400},
    );
  }
}
