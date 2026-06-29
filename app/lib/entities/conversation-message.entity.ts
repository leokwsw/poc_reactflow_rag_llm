import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "conversation_messages"})
export class ConversationMessageEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  conversation_id!: string;

  @Column({type: "text"})
  role!: string;

  @Column({type: "text"})
  content!: string;

  @Column({type: "text", nullable: true})
  workflow_run_id!: string | null;

  @Column({type: "text"})
  status!: string;

  @Column({type: "jsonb", default: {}})
  metadata!: Record<string, unknown>;

  @Column({type: "timestamptz"})
  created_at!: Date;
}
