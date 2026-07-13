import ChatClient from "@/app/chat/chat-client";
import type {ConversationMessageRecord, ConversationRecord} from "@/app/types/domain";
import type {WorkflowRecord} from "@/app/types/domain";
import {backendFetch} from "@/app/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const [workflowResult, conversationResult] = await Promise.all([
    backendFetch<{workflows: WorkflowRecord[]}>("/workflows"),
    backendFetch<{conversations: ConversationRecord[]}>("/conversations"),
  ]);
  const {workflows} = workflowResult;
  const {conversations} = conversationResult;
  const selectedConversationId = conversations[0]?.id ?? "";
  const initialMessages = selectedConversationId
    ? (await backendFetch<{messages: ConversationMessageRecord[]}>(`/conversations/${selectedConversationId}/messages`)).messages
    : [];

  return (
    <ChatClient
      conversations={conversations}
      initialMessages={initialMessages}
      selectedConversationId={selectedConversationId}
      workflows={workflows}
    />
  );
}
