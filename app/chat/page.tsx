import ChatClient from "@/app/chat/chat-client";
import {listConversationMessages, listConversations} from "@/app/chat/data";
import {listWorkflows} from "@/app/workflow/data";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const [workflows, conversations] = await Promise.all([
    listWorkflows(),
    listConversations(),
  ]);
  const selectedConversationId = conversations[0]?.id ?? "";
  const initialMessages = selectedConversationId
    ? await listConversationMessages(selectedConversationId, {includeRuns: true})
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
