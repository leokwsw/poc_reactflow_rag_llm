import { ChatsClient } from '@/components/ChatsClient';

export default function ChatsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Chats</h1>
          <p className="page-subtitle">Every conversation is based on a workflow, and every user message creates a workflow run.</p>
        </div>
      </header>
      <ChatsClient />
    </div>
  );
}
