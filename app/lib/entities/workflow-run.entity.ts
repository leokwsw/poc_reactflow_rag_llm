import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "workflow_runs"})
export class WorkflowRunEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  workflow_id!: string;

  @Column({type: "text"})
  status!: string;

  @Column({type: "text", default: ""})
  query!: string;

  @Column({type: "jsonb", default: {}})
  input!: Record<string, unknown>;

  @Column({type: "jsonb", nullable: true})
  result!: Record<string, unknown> | null;

  @Column({type: "jsonb", default: []})
  trace!: unknown[];

  @Column({type: "text", nullable: true})
  error!: string | null;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz", nullable: true})
  finished_at!: Date | null;
}
