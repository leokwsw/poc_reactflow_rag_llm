'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, Workflow } from 'lucide-react';
import { api, type RagMode } from '@/lib/api';

const initialNodes: Node[] = [
  { id: 'input', type: 'default', position: { x: 80, y: 120 }, data: { label: 'Input' } },
  { id: 'documentRetriever', type: 'default', position: { x: 300, y: 70 }, data: { label: 'Document Retriever' } },
  { id: 'graphRetriever', type: 'default', position: { x: 300, y: 190 }, data: { label: 'Graph Retriever' } },
  { id: 'reranker', type: 'default', position: { x: 550, y: 130 }, data: { label: 'Reranker' } },
  { id: 'llm', type: 'default', position: { x: 770, y: 130 }, data: { label: 'LLM' } },
  { id: 'output', type: 'default', position: { x: 970, y: 130 }, data: { label: 'Output' } },
];

const initialEdges: Edge[] = [
  { id: 'e-input-doc', source: 'input', target: 'documentRetriever' },
  { id: 'e-input-graph', source: 'input', target: 'graphRetriever' },
  { id: 'e-doc-rerank', source: 'documentRetriever', target: 'reranker' },
  { id: 'e-graph-rerank', source: 'graphRetriever', target: 'reranker' },
  { id: 'e-rerank-llm', source: 'reranker', target: 'llm' },
  { id: 'e-llm-output', source: 'llm', target: 'output' },
];

const nodeTypes = ['input', 'documentRetriever', 'graphRetriever', 'reranker', 'llm', 'output'];

export function StudioClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('input');
  const [query, setQuery] = useState('Explain how graph retrieval improves native RAG.');
  const [mode, setMode] = useState<RagMode>('hybrid');
  const [workflowId, setWorkflowId] = useState<string>();
  const [result, setResult] = useState<unknown>();
  const [status, setStatus] = useState('Draft workflow');

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0],
    [nodes, selectedNodeId],
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges],
  );

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: 'default',
        position: { x: 160 + currentNodes.length * 28, y: 260 + currentNodes.length * 16 },
        data: { label: type },
      },
    ]);
    setSelectedNodeId(id);
  };

  const saveWorkflow = async () => {
    setStatus('Saving workflow');
    const payload = {
      name: 'RAG Studio MVP Workflow',
      description: 'Native + Graph RAG flow built in ReactFlow.',
      nodes,
      edges,
    };
    if (workflowId) {
      await api.updateWorkflow(workflowId, payload);
    } else {
      const created = await api.createWorkflow(payload);
      setWorkflowId(created.id);
    }
    setStatus('Workflow saved');
  };

  const runWorkflow = async () => {
    setStatus('Running workflow');
    let activeWorkflowId = workflowId;
    if (!activeWorkflowId) {
      const created = await api.createWorkflow({
        name: 'RAG Studio MVP Workflow',
        description: 'Native + Graph RAG flow built in ReactFlow.',
        nodes,
        edges,
      });
      activeWorkflowId = created.id;
      setWorkflowId(created.id);
    }
    const run = await api.runWorkflow(activeWorkflowId, { query, mode });
    setResult(run);
    setStatus('Run completed');
  };

  return (
    <div className="studio-grid">
      <section className="node-palette panel">
        <div className="panel-header">
          <h2 className="panel-title">Node Palette</h2>
          <Workflow size={16} />
        </div>
        <div className="panel-body palette-list">
          {nodeTypes.map((type) => (
            <button key={type} className="palette-item" onClick={() => addNode(type)}>
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="flow-panel panel" aria-label="Workflow canvas">
        <div className="studio-toolbar">
          <div>
            <strong>RAG Workflow</strong>
            <span>{status}</span>
          </div>
          <div className="toolbar-actions">
            <button className="button" onClick={saveWorkflow}>
              <Save size={15} />
              Save
            </button>
            <button className="button primary" onClick={runWorkflow}>
              <Play size={15} />
              Run
            </button>
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </section>

      <aside className="inspector panel">
        <div className="panel-header">
          <h2 className="panel-title">Inspector</h2>
          <span className="status">{selectedNode?.id}</span>
        </div>
        <div className="panel-body inspector-body">
          <div className="field">
            <label>Selected node</label>
            <input className="input" value={String(selectedNode?.data?.label ?? '')} readOnly />
          </div>
          <div className="field">
            <label>Run mode</label>
            <select className="select" value={mode} onChange={(event) => setMode(event.target.value as RagMode)}>
              <option value="native">Native RAG</option>
              <option value="graph">Graph RAG</option>
              <option value="hybrid">Hybrid RAG</option>
            </select>
          </div>
          <div className="field">
            <label>Input query</label>
            <textarea className="textarea" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </aside>

      <section className="trace-panel panel">
        <div className="panel-header">
          <h2 className="panel-title">Run Trace</h2>
          <span className="status">{workflowId ? workflowId.slice(0, 8) : 'unsaved'}</span>
        </div>
        <div className="panel-body">
          <pre className="pre">{JSON.stringify(result ?? { status, nodes: nodes.length, edges: edges.length }, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
