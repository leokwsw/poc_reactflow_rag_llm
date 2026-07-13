import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "mcp_servers"})
export class McpServerEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  name!: string;

  @Column({type: "text"})
  server_identifier!: string;

  @Column({type: "text"})
  server_url!: string;

  @Column({type: "jsonb", default: []})
  tools!: unknown[];

  @Column({type: "text", nullable: true})
  tools_error!: string | null;

  @Column({type: "timestamptz", nullable: true})
  tools_updated_at!: Date | null;

  @Column({type: "timestamptz"})
  created_at!: Date;

  @Column({type: "timestamptz"})
  updated_at!: Date;
}
