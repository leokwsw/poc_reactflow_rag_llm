import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "chunks"})
export class DocumentChunkEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  file_id!: string;

  @Column({type: "text"})
  text!: string;

  @Column({type: "integer"})
  position!: number;

  @Column({type: "jsonb", default: {}})
  metadata!: Record<string, unknown>;

  @Column({type: "text", default: ""})
  es_document_id!: string;

  @Column({type: "boolean", default: true})
  enabled!: boolean;
}
