import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "workflow_graphs"})
export class WorkflowGraphEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  title!: string;

  @Column({type: "text", default: ""})
  description!: string;

  @Column({type: "jsonb"})
  graph!: Record<string, unknown>;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_at!: Date;
}
