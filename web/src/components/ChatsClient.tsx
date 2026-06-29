'use client';

import { useEffect, useState } from 'react';
import { MessageSquarePlus, RefreshCw, Send } from 'lucide-react';
import { api, type RagMode } from '@/lib/api';

type WorkflowRow = { id: string; name: string };
type ConversationRow = {
  id: string;
  title: string;
  workflow: WorkflowRow;
  messages: Array<{ role: string; content: string }>;
  _count: { messages: number };
};
type ConversationDetail = {
  id: string;
  title: string;
  workflow: WorkflowRow;
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
  runs: unknown[];
};

export function ChatsClient() {
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [active, setActive] = useState<ConversationDetail | null>(null);
  const [workflowId, setWorkflowId] = useState('');
  const [title, setTitle] = useState('Security Assistant');
  const [message, setMessage] = useState('What are the security requirements for vendor access?');
  const [mode, setMode] = useState<RagMode>('hybrid');
  const [status, setStatus] = useState('Ready');

  const refresh = async () => {
    const [workflowRows, conversationRows] = await Promise.all([api.listWorkflows(), api.listConversations()]);
    setWorkflows(workflowRows);
    setWorkflowId((current) => current || workflowRows[0]?.id || '');
    setConversations(conversationRows);
  };

  const loadConversation = async (id: string) => {
    setActive(await api.getConversation(id));
  };

  useEffect(() => {
    void refresh();
  }, []);

  const createConversation = async () => {
    if (!workflowId) return;
    setStatus('Creating conversation');
    const created = await api.createConversation({ workflowId, title });
    await refresh();
    await loadConversation(created.id);
    setStatus('Conversation created');
  };

  const send = async () => {
    if (!active || !message.trim()) return;
    setStatus('Running workflow');
    await api.sendConversationMessage(active.id, { content: message, mode });
    setMessage('');
    await loadConversation(active.id);
    await refresh();
    setStatus('Workflow completed');
  };

  return (
    <div className="chat-layout">
      <section className="panel chat-list-panel">
        <div className="panel-header">
          <h2 className="panel-title">Chat List</h2>
          <button className="button ghost" onClick={refresh}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Workflow</label>
            <select className="select" value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Conversation Title</label>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <button className="button primary" disabled={!workflowId} onClick={createConversation}>
            <MessageSquarePlus size={15} />
            New Chat
          </button>
          <div className="record-list">
            {conversations.map((conversation) => (
              <button key={conversation.id} className="record-row" onClick={() => loadConversation(conversation.id)}>
                <strong>{conversation.title}</strong>
                <span>{conversation.workflow.name} · {conversation._count.messages} messages</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel chat-panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{active?.title ?? 'Select a chat'}</h2>
            <p className="mini-subtitle">{active ? `Workflow: ${active.workflow.name}` : 'Each message executes the selected workflow.'}</p>
          </div>
          <span className="status">{status}</span>
        </div>
        <div className="chat-messages">
          {(active?.messages ?? []).map((row) => (
            <div key={row.id} className={`chat-message ${row.role}`}>
              <strong>{row.role}</strong>
              <p>{row.content}</p>
            </div>
          ))}
          {!active ? <p className="empty-note">Create or select a conversation to start.</p> : null}
        </div>
        <div className="chat-composer">
          <select className="select" value={mode} onChange={(event) => setMode(event.target.value as RagMode)}>
            <option value="native">Native</option>
            <option value="graph">Graph</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <input className="input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask through this workflow" />
          <button className="button primary" disabled={!active} onClick={send}>
            <Send size={15} />
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
