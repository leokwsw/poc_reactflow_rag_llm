import ChatClient from "@/app/chat/chat-client";
import type {ConversationMessageRecord, ConversationRecord} from "@/app/types/domain";
import type {WorkflowRecord} from "@/app/types/domain";
import {backendFetch} from "@/app/lib/backend-api";

export const dynamic = "force-dynamic";

type ChatConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ChatConversationPage({params}: ChatConversationPageProps) {
  const {conversationId} = await params;
  const [workflowResult, conversationResult, selectedResult] = await Promise.all([
    backendFetch<{workflows: WorkflowRecord[]}>("/workflows"),
    backendFetch<{conversations: ConversationRecord[]}>("/conversations"),
    backendFetch<{conversation: ConversationRecord}>(`/conversations/${conversationId}`).catch(() => null),
  ]);
  const {workflows} = workflowResult;
  const {conversations} = conversationResult;
  const selectedConversation = selectedResult?.conversation;
  const initialMessages = selectedConversation
    ? (await backendFetch<{messages: ConversationMessageRecord[]}>(`/conversations/${conversationId}/messages`)).messages
    : [];

  return (
    <ChatClient
      conversations={conversations}
      initialMessages={initialMessages}
      selectedConversationId={selectedConversation?.id ?? ""}
      workflows={workflows}
    />
  );
}
