'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  BookOpen,
  Boxes,
  Braces,
  Check,
  ChevronDown,
  Copy,
  Database,
  FileText,
  GitBranch,
  Grid2X2,
  Lock,
  Maximize,
  MoreHorizontal,
  PanelRightClose,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { api, type RagMode } from '@/lib/api';

type StudioNodeData = {
  title: string;
  subtitle?: string;
  icon: 'input' | 'docs' | 'graph' | 'rerank' | 'llm' | 'output';
  accent: 'green' | 'purple' | 'blue' | 'orange';
  rows: Array<{ label: string; value: string }>;
};

type StudioFlowNode = Node<StudioNodeData, 'studio'>;

const iconMap = {
  input: GitBranch,
  docs: BookOpen,
  graph: Database,
  rerank: Boxes,
  llm: Sparkles,
  output: Braces,
};

function StudioNodeCard({ data, selected }: NodeProps<StudioFlowNode>) {
  const Icon = iconMap[data.icon];

  return (
    <div className={`studio-node-card node-${data.accent} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="studio-handle" />
      <div className="node-card-title">
        <span className="node-card-icon">
          <Icon size={15} />
        </span>
        <strong>{data.title}</strong>
      </div>
      <div className="node-card-rows">
        {data.rows.map((row) => (
          <div key={row.label} className="node-card-row">
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>
      <div className="node-card-footer">
        <span className="node-ok">
          <Check size={11} />
        </span>
        <MoreHorizontal size={15} />
      </div>
      <Handle type="source" position={Position.Right} className="studio-handle" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  studio: StudioNodeCard,
};

const initialNodes: StudioFlowNode[] = [
  {
    id: 'input',
    type: 'studio',
    position: { x: 36, y: 185 },
    data: {
      title: 'Input',
      icon: 'input',
      accent: 'green',
      rows: [{ label: 'Text', value: 'query' }],
    },
  },
  {
    id: 'documentRetriever',
    type: 'studio',
    position: { x: 265, y: 88 },
    data: {
      title: 'Document Retriever',
      icon: 'docs',
      accent: 'purple',
      rows: [
        { label: 'Vector Store', value: 'docs' },
        { label: 'enterprise_docs', value: '' },
      ],
    },
  },
  {
    id: 'graphRetriever',
    type: 'studio',
    position: { x: 265, y: 240 },
    data: {
      title: 'Graph Retriever',
      icon: 'graph',
      accent: 'blue',
      rows: [
        { label: 'Graph Store', value: 'entities' },
        { label: 'knowledge_graph', value: '' },
      ],
    },
  },
  {
    id: 'reranker',
    type: 'studio',
    position: { x: 600, y: 180 },
    data: {
      title: 'Reranker',
      icon: 'rerank',
      accent: 'orange',
      rows: [
        { label: 'docel', value: 'items' },
        { label: 'mixedbread-ai/mxbai-rerank-base-v1', value: '' },
      ],
    },
  },
  {
    id: 'llm',
    type: 'studio',
    position: { x: 850, y: 185 },
    data: {
      title: 'LLM',
      icon: 'llm',
      accent: 'purple',
      rows: [
        { label: 'Model', value: 'response' },
        { label: 'gpt-4o-mini', value: '' },
      ],
    },
  },
  {
    id: 'output',
    type: 'studio',
    position: { x: 1095, y: 190 },
    data: {
      title: 'Output',
      icon: 'output',
      accent: 'green',
      rows: [{ label: 'Text', value: '' }],
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e-input-doc', source: 'input', target: 'documentRetriever' },
  { id: 'e-input-graph', source: 'input', target: 'graphRetriever' },
  { id: 'e-doc-rerank', source: 'documentRetriever', target: 'reranker' },
  { id: 'e-graph-rerank', source: 'graphRetriever', target: 'reranker' },
  { id: 'e-rerank-llm', source: 'reranker', target: 'llm' },
  { id: 'e-llm-output', source: 'llm', target: 'output' },
].map((edge) => ({
  ...edge,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
  style: { stroke: '#46556b', strokeWidth: 1.8 },
}));

const traceSteps = [
  { id: 'input', label: 'Input', time: '124ms', tone: 'green' },
  { id: 'documentRetriever', label: 'Document Retriever', time: '532ms', tone: 'green' },
  { id: 'graphRetriever', label: 'Graph Retriever', time: '412ms', tone: 'blue' },
  { id: 'reranker', label: 'Reranker', time: '610ms', tone: 'orange' },
  { id: 'llm', label: 'LLM', time: '512ms', tone: 'purple' },
  { id: 'output', label: 'Output', time: '140ms', tone: 'green' },
];

const entityRows = [
  ['Vendor Access Policy', 'Document', '0.92', '1', 'source: policy_12, created: 2024-01-15'],
  ['MFA Requirement', 'Requirement', '0.89', '1', 'control: IAM-2, criticality: High'],
  ['Vendor', 'Entity', '0.87', '1', 'category: Third-Party'],
  ['Access Review', 'Process', '0.81', '2', 'cadence: Quarterly, owner: Security Team'],
  ['Least Privilege', 'Principle', '0.79', '1', 'domain: Access Control'],
  ['Vendor Onboarding', 'Process', '0.76', '2', 'owner: Vendor Mgmt'],
  ['Data Classification', 'Policy', '0.74', '2', 'level: Confidential'],
  ['Security Training', 'Control', '0.72', '2', 'frequency: Annual'],
];

export function StudioClient() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState('graphRetriever');
  const [query, setQuery] = useState('What are the security requirements for vendor access?');
  const [mode, setMode] = useState<RagMode>('hybrid');
  const [workflowId, setWorkflowId] = useState<string>();
  const [result, setResult] = useState<unknown>();
  const [status, setStatus] = useState('All changes saved');

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0],
    [nodes, selectedNodeId],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
            style: { stroke: '#46556b', strokeWidth: 1.8 },
          },
          currentEdges,
        ),
      ),
    [setEdges],
  );

  const addNode = () => {
    const id = `graphRetriever-${Date.now()}`;
    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: 'studio',
        position: { x: 360 + currentNodes.length * 24, y: 300 + currentNodes.length * 12 },
        data: {
          title: 'Graph Retriever',
          icon: 'graph',
          accent: 'blue',
          rows: [
            { label: 'Graph Store', value: 'entities' },
            { label: 'knowledge_graph', value: '' },
          ],
        },
      },
    ]);
    setSelectedNodeId(id);
    setStatus('Unsaved changes');
  };

  const saveWorkflow = async () => {
    setStatus('Saving...');
    const payload = {
      name: 'RAG Pipeline',
      description: 'Enterprise Search RAG workflow.',
      nodes,
      edges,
    };
    if (workflowId) {
      await api.updateWorkflow(workflowId, payload);
    } else {
      const created = await api.createWorkflow(payload);
      setWorkflowId(created.id);
    }
    setStatus('All changes saved');
  };

  const runWorkflow = async () => {
    setStatus('Running...');
    let activeWorkflowId = workflowId;
    if (!activeWorkflowId) {
      const created = await api.createWorkflow({
        name: 'RAG Pipeline',
        description: 'Enterprise Search RAG workflow.',
        nodes,
        edges,
      });
      activeWorkflowId = created.id;
      setWorkflowId(created.id);
    }
    const run = await api.runWorkflow(activeWorkflowId, { query, mode });
    setResult(run);
    setStatus('All changes saved');
  };

  return (
    <div className="studio-board">
      <header className="studio-topbar">
        <div className="breadcrumbs">
          <span>Projects</span>
          <b>/</b>
          <span>Enterprise Search</span>
          <b>/</b>
          <strong>RAG Pipeline</strong>
          <ChevronDown size={15} />
        </div>
        <div className="topbar-actions">
          <span className="saved-indicator">
            <Check size={14} />
            {status}
          </span>
          <button className="button">
            <Share2 size={15} />
            Share
          </button>
          <button className="button primary run-button" onClick={runWorkflow}>
            <Play size={15} />
            Run
            <ChevronDown size={14} />
          </button>
          <button className="icon-button" aria-label="More actions">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      <main className="studio-main">
        <section className="canvas-shell">
          <div className="pipeline-tabs">
            <button className="pipeline-tab active">
              <BookOpen size={15} />
              RAG Pipeline
              <span />
            </button>
            <button className="icon-button" onClick={addNode} aria-label="Add node">
              <Plus size={16} />
            </button>
          </div>

          <div className="canvas-toolbar">
            <div className="toolbar-group">
              <button className="icon-button" aria-label="Undo">
                <Undo2 size={16} />
              </button>
              <button className="icon-button muted" aria-label="Redo">
                <Redo2 size={16} />
              </button>
              <button className="icon-button" aria-label="Search">
                <Search size={16} />
              </button>
              <button className="icon-button" aria-label="Fit view">
                <Maximize size={16} />
              </button>
              <button className="icon-button" aria-label="Grid">
                <Grid2X2 size={16} />
              </button>
            </div>
            <div className="toolbar-group zoom-group">
              <button className="icon-button" aria-label="Zoom out">
                <ZoomOut size={15} />
              </button>
              <span>100%</span>
              <button className="icon-button" aria-label="Zoom in">
                <ZoomIn size={15} />
              </button>
            </div>
            <div className="toolbar-group">
              <button className="icon-button" aria-label="Lock">
                <Lock size={15} />
              </button>
              <button className="button" onClick={saveWorkflow}>
                <Check size={15} />
                Validate
              </button>
            </div>
            <div className="run-meta">
              <span className="green-dot" />
              Last run 2m ago
              <span className="success-pill">
                <Check size={13} />
                Success
              </span>
            </div>
          </div>

          <div className="flow-stage">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              minZoom={0.45}
              maxZoom={1.4}
            >
              <Background color="#d7dee9" gap={18} size={1} />
            </ReactFlow>
          </div>

          <TracePanel
            query={query}
            onQueryChange={setQuery}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            result={result}
          />
        </section>

        <Inspector selectedNode={selectedNode} mode={mode} onModeChange={setMode} />
      </main>
    </div>
  );
}

function TracePanel({
  query,
  onQueryChange,
  selectedNodeId,
  onSelectNode,
  result,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selectedNodeId: string;
  onSelectNode: (value: string) => void;
  result: unknown;
}) {
  return (
    <section className="trace-dock">
      <div className="trace-tabs">
        <button className="active">Trace</button>
        <button>Results</button>
        <button>Logs</button>
      </div>

      <div className="trace-grid">
        <aside className="trace-run-list">
          <div className="trace-run-summary">
            <span className="success-pill">
              <Check size={12} />
              Success
            </span>
            <span>Run ID</span>
            <strong>a1b2c3d4</strong>
            <Copy size={14} />
          </div>
          <p>May 14, 2025 10:42:18 AM</p>
          {traceSteps.map((step) => (
            <button
              key={step.id}
              className={`trace-step ${selectedNodeId === step.id ? 'selected' : ''}`}
              onClick={() => onSelectNode(step.id)}
            >
              <span className={`step-dot ${step.tone}`}>
                <Check size={10} />
              </span>
              <strong>{step.label}</strong>
              <b>{step.time}</b>
            </button>
          ))}
        </aside>

        <article className="trace-detail">
          <div className="trace-detail-header">
            <span className="mini-icon blue">
              <Database size={14} />
            </span>
            <strong>Graph Retriever</strong>
            <span>412ms</span>
          </div>
          <div className="trace-section">
            <button className="trace-disclosure">
              <ChevronDown size={14} />
              Input
            </button>
            <div className="trace-input-row">
              <span>query</span>
              <input value={query} onChange={(event) => onQueryChange(event.target.value)} />
            </div>
          </div>
          <div className="trace-section">
            <button className="trace-disclosure">
              <ChevronDown size={14} />
              Retrieved Entities (8)
            </button>
            <table className="entity-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Hops</th>
                  <th>Properties</th>
                </tr>
              </thead>
              <tbody>
                {entityRows.map((row) => (
                  <tr key={row[0]}>
                    <td>
                      <a href="#">{row[0]}</a>
                    </td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>{row[3]}</td>
                    <td>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result ? <pre className="trace-json">{JSON.stringify(result, null, 2)}</pre> : null}
        </article>

        <aside className="visual-panel">
          <h3>Visualization</h3>
          <div className="mini-graph" aria-label="Graph visualization preview">
            <span className="graph-node graph-top">MFA<br />Requirement</span>
            <span className="graph-node graph-left">Vendor</span>
            <span className="graph-node graph-center">Vendor Access<br />Policy</span>
            <span className="graph-node graph-right">Least<br />Privilege</span>
            <span className="graph-node graph-bottom-left">Vendor<br />Onboarding</span>
            <span className="graph-node graph-bottom-right">Access<br />Review</span>
          </div>
          <div className="visual-controls">
            <button className="icon-button">
              <Maximize size={15} />
            </button>
            <button className="icon-button">
              <ZoomOut size={15} />
            </button>
            <button className="icon-button">
              <ZoomIn size={15} />
            </button>
            <button className="icon-button">
              <PanelRightClose size={15} />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Inspector({
  selectedNode,
  mode,
  onModeChange,
}: {
  selectedNode: StudioFlowNode;
  mode: RagMode;
  onModeChange: (value: RagMode) => void;
}) {
  return (
    <aside className="studio-inspector">
      <div className="inspector-tabs">
        <button className="active">Node</button>
        <button>Graph</button>
        <button className="close-button">
          <PanelRightClose size={16} />
        </button>
      </div>
      <div className="inspector-scroll">
        <div className="inspector-title-block">
          <span className="mini-icon blue">
            <Database size={18} />
          </span>
          <div>
            <h2>{selectedNode.data.title}</h2>
            <p>Retrieve relevant entities and relationships from a graph store.</p>
          </div>
        </div>

        <div className="field compact">
          <label>Node ID</label>
          <div className="copy-field">
            <input className="input" value={selectedNode.id} readOnly />
            <Copy size={15} />
          </div>
        </div>

        <section className="inspector-section">
          <h3>Graph Store</h3>
          <div className="field compact">
            <label>Graph Store</label>
            <select className="select" defaultValue="knowledge_graph">
              <option value="knowledge_graph">knowledge_graph</option>
              <option value="vendor_graph">vendor_graph</option>
            </select>
          </div>
          <a href="#" className="inline-link">Open in explorer</a>
        </section>

        <section className="inspector-section">
          <h3>Search Settings</h3>
          <div className="field compact">
            <label>Query Field</label>
            <select className="select" defaultValue="name_embedding">
              <option value="name_embedding">name_embedding</option>
              <option value="content_embedding">content_embedding</option>
            </select>
          </div>
          <div className="settings-pair">
            <div className="field compact">
              <label>Top K</label>
              <input className="input" type="number" defaultValue={50} />
            </div>
            <div className="field compact">
              <label>Max Hops</label>
              <input className="input" type="number" defaultValue={2} />
            </div>
          </div>
          <div className="field compact">
            <label>Score Threshold</label>
            <input className="input" type="number" defaultValue={0.3} step={0.1} />
          </div>
        </section>

        <section className="inspector-section">
          <h3>Run Mode</h3>
          <select className="select" value={mode} onChange={(event) => onModeChange(event.target.value as RagMode)}>
            <option value="native">Native RAG</option>
            <option value="graph">Graph RAG</option>
            <option value="hybrid">Hybrid RAG</option>
          </select>
        </section>

        <section className="inspector-section">
          <h3>Filters <span>(Optional)</span></h3>
          <button className="add-filter">
            <Plus size={14} />
            Add filter
          </button>
        </section>

        <section className="inspector-section">
          <h3>Output</h3>
          <div className="field compact">
            <label>Output Field</label>
            <input className="input" defaultValue="entities" />
          </div>
        </section>

        <button className="delete-node">
          <Trash2 size={15} />
          Delete Node
        </button>
      </div>
    </aside>
  );
}
