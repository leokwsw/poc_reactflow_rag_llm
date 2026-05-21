import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity({name: "model_configs"})
export class ModelConfigEntity {
  @PrimaryColumn({type: "text"})
  id!: string;

  @Column({type: "text"})
  label!: string;

  @Column({type: "text", default: "llm"})
  model_type!: string;

  @Column({type: "text", default: ""})
  api_base_url!: string;

  @Column({type: "text", default: ""})
  api_key!: string;

  @Column({type: "text", default: ""})
  provider_model!: string;

  @Column({type: "timestamptz"})
  updated_at!: Date;
}
