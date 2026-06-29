import ChatClient from "@/app/chat/chat-client";
import {getConversationById, listConversationMessages, listConversations} from "@/app/chat/data";
import {listWorkflows} from "@/app/workflow/data";

export const dynamic = "force-dynamic";

type ChatConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ChatConversationPage({params}: ChatConversationPageProps) {
  const {conversationId} = await params;
  const [workflows, conversations, selectedConversation] = await Promise.all([
    listWorkflows(),
    listConversations(),
    getConversationById(conversationId),
  ]);
  const initialMessages = selectedConversation
    ? await listConversationMessages(conversationId, {includeRuns: true})
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
