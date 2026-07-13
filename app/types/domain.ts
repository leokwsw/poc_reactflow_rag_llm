import type {WorkflowDataType} from '@/app/components/workflow/types'
import type {WorkflowTraceItem} from '@/app/components/workflow/nodes/execution-types'
import type {ModelProfileId, ModelProvider, ModelProviderSdk, ModelType} from '@/app/model/profiles'

export type WorkflowRecord = {
  id: string; title: string; description: string; graph: WorkflowDataType;
  created_at: string; updated_at: string; run_count?: number; last_run_at?: string | null;
}
export type WorkflowRunRecord = {
  id: string; workflow_id: string; status: 'running' | 'completed' | 'failed'; query: string;
  input: Record<string, unknown>; result: Record<string, unknown> | null; trace: WorkflowTraceItem[];
  error: string | null; created_at: string; finished_at: string | null;
}
export type ConversationRecord = {
  id: string; title: string; workflow_id: string; workflow_title?: string; status: 'active' | 'archived';
  created_at: string; updated_at: string; last_message_at: string | null; last_message?: string; message_count?: number;
}
export type ConversationMessageRecord = {
  id: string; conversation_id: string; role: 'user' | 'assistant' | 'system'; content: string;
  workflow_run_id: string | null; status: 'pending' | 'completed' | 'failed'; metadata: Record<string, unknown>;
  created_at: string; workflow_run?: WorkflowRunRecord | null;
}
export type ModelConfig = {
  id: ModelProfileId; label: string; provider: ModelProvider; sdk: ModelProviderSdk; model_type: ModelType;
  api_base_url: string; api_key: string; api_key_configured: boolean; model: string; updated_at: string;
}
export type Dataset = {
  id: string; title: string; description: string; created_at: string; updated_at: string;
  embedding_config: {api_base_url: string; api_key: string; model: string};
  reranking_config: {api_base_url: string; api_key: string; model: string; top_k: number; score: number};
  chunk_config: {chunk_size: number; chunk_overlap: number}; language_hint: string; separators: string; keep_separators: boolean;
}
export type DatasetDocument = {
  id: string; file_name: string; dataset_id: string; file_size: number; created_at: string; updated_time: string;
  uploaded_time: string; deleted: string; deleted_at: string; upload_source: string; mime_type: string; ext: string;
  storage_page: string; status: string; enabled: boolean;
}
export type DocumentChunk = {
  id: string; file_id: string; text: string; position: number; metadata: {page?: number; section?: string; source?: string};
  es_document_id: string; enabled: boolean;
}
export type McpTool = {name: string; description?: string; inputSchema?: Record<string, unknown>}
export type McpServer = {
  id: string; name: string; server_identifier: string; server_url: string; tools: McpTool[]; tools_error: string | null;
  tools_updated_at: string | null; created_at: string; updated_at: string;
}
export type ToolKeyValueRow = {id?: string; enabled?: boolean; name?: string; value?: string}
export type ToolRecord = {
  id: string; name: string; description: string; type: 'custom_http'; method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'HEAD'|'OPTIONS';
  url: string; base_url: string; path: string; headers: ToolKeyValueRow[]; params: ToolKeyValueRow[];
  body_type: 'none'|'json'|'raw'|'x-www-form-urlencoded'; body_json: string; body_raw: string;
  input_schema: Record<string, unknown>; auth_type: 'none'|'basic'|'bearer'; auth_username: string; auth_password: string;
  auth_token: string; openapi_import_id: string; openapi_operation_id: string; enabled: boolean;
  skip_ssl_verification: boolean; created_at: string; updated_at: string;
}
