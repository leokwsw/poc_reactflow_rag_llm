import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "tasks"})
export class DatasetTaskEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  dataset_id!: string;

  @Column({type: "text", array: true})
  document_ids!: string[];

  @Column({type: "text", array: true})
  file_paths!: string[];

  @Column({type: "text"})
  status!: string;

  @Column({type: "text", nullable: true})
  error!: string | null;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_at!: Date;
}
