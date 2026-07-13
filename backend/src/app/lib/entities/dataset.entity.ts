import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "datasets"})
export class DatasetEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  title!: string;

  @Column({type: "text", default: ""})
  description!: string;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_at!: Date;

  @Column({type: "jsonb"})
  embedding_config!: Record<string, unknown>;

  @Column({type: "jsonb"})
  reranking_config!: Record<string, unknown>;

  @Column({type: "jsonb"})
  chunk_config!: Record<string, unknown>;

  @Column({type: "text", default: "chinese"})
  language_hint!: string;

  @Column({type: "text", default: "\n\n"})
  separators!: string;

  @Column({type: "boolean", default: true})
  keep_separators!: boolean;
}
