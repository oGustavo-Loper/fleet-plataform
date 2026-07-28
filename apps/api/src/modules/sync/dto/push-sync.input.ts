import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class PushSyncInput {
  @Field()
  tenantId!: string;

  @Field()
  deviceId!: string;

  @Field()
  entity!: string;

  @Field()
  operation!: string;

  @Field()
  operationId!: string;

  @Field()
  payloadJson!: string;
}
