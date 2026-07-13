import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "documents"})
export class DatasetDocumentEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  file_name!: string;

  @Column({type: "text"})
  dataset_id!: string;

  @Column({type: "bigint"})
  file_size!: string;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_time!: Date;

  @Column({type: "timestamptz"})
  uploaded_time!: Date;

  @Column({type: "text", default: "false"})
  deleted!: string;

  @Column({type: "text", default: ""})
  deleted_at!: string;

  @Column({type: "text", default: "file"})
  upload_source!: string;

  @Column({type: "text", default: ""})
  mime_type!: string;

  @Column({type: "text", default: ""})
  ext!: string;

  @Column({type: "text"})
  storage_page!: string;

  @Column({type: "text"})
  status!: string;

  @Column({type: "boolean", default: true})
  enabled!: boolean;
}
