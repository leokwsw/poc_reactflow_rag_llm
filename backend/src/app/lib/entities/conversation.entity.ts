import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "conversations"})
export class ConversationEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  title!: string;

  @Column({type: "text"})
  workflow_id!: string;

  @Column({type: "text"})
  status!: string;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_at!: Date;

  @Column({type: "timestamptz", nullable: true})
  last_message_at!: Date | null;
}
