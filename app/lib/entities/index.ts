import type {DataSourceOptions} from "typeorm";
import {DatasetDocumentEntity} from "@/app/lib/entities/dataset-document.entity";
import {DatasetTaskEntity} from "@/app/lib/entities/dataset-task.entity";
import {DatasetEntity} from "@/app/lib/entities/dataset.entity";
import {DocumentChunkEntity} from "@/app/lib/entities/document-chunk.entity";
import {EmbeddingEntity} from "@/app/lib/entities/embedding.entity";
import {McpServerEntity} from "@/app/lib/entities/mcp-server.entity";
import {ModelConfigEntity} from "@/app/lib/entities/model-config.entity";
import {WorkflowGraphEntity} from "@/app/lib/entities/workflow-graph.entity";
import {WorkflowRunEntity} from "@/app/lib/entities/workflow-run.entity";

export {DatasetDocumentEntity} from "@/app/lib/entities/dataset-document.entity";
export {DatasetTaskEntity} from "@/app/lib/entities/dataset-task.entity";
export {DatasetEntity} from "@/app/lib/entities/dataset.entity";
export {DocumentChunkEntity} from "@/app/lib/entities/document-chunk.entity";
export {EmbeddingEntity} from "@/app/lib/entities/embedding.entity";
export {McpServerEntity} from "@/app/lib/entities/mcp-server.entity";
export {ModelConfigEntity} from "@/app/lib/entities/model-config.entity";
export {WorkflowGraphEntity} from "@/app/lib/entities/workflow-graph.entity";
export {WorkflowRunEntity} from "@/app/lib/entities/workflow-run.entity";

export const typeormEntities: NonNullable<DataSourceOptions["entities"]> = [
  DatasetEntity,
  DatasetDocumentEntity,
  DocumentChunkEntity,
  DatasetTaskEntity,
  EmbeddingEntity,
  WorkflowGraphEntity,
  WorkflowRunEntity,
  McpServerEntity,
  ModelConfigEntity,
];
