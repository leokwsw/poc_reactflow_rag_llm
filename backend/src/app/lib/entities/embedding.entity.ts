import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "embeddings"})
export class EmbeddingEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  chunk_id!: string;

  @Column({type: "text"})
  dataset_id!: string;

  @Column({type: "text"})
  file_id!: string;

  @Column({type: "jsonb"})
  vector!: number[];

  @Column({type: "text"})
  provider!: string;

  @Column({type: "boolean", default: false})
  elasticsearch_saved!: boolean;

  @Column({type: "timestamptz"})
  created_at!: Date;
}
