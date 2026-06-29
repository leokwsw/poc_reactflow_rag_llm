import {NextResponse} from "next/server";
import {deleteConversation, getConversationById, updateConversation} from "@/app/chat/data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const {conversationId} = await context.params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json({error: "Conversation not found."}, {status: 404});
  }
  return NextResponse.json({conversation});
}

export async function PATCH(request: Request, context: RouteContext) {
  const {conversationId} = await context.params;
  const body = await request.json().catch(() => ({})) as {title?: unknown; status?: unknown};
  const conversation = await updateConversation(conversationId, {
    title: typeof body.title === "string" ? body.title : undefined,
    status: body.status === "archived" || body.status === "active" ? body.status : undefined,
  });
  if (!conversation) {
    return NextResponse.json({error: "Conversation not found."}, {status: 404});
  }
  return NextResponse.json({conversation});
}

export async function DELETE(_request: Request, context: RouteContext) {
  const {conversationId} = await context.params;
  const deleted = await deleteConversation(conversationId);
  if (!deleted) {
    return NextResponse.json({error: "Conversation not found."}, {status: 404});
  }
  return NextResponse.json({success: true});
}
