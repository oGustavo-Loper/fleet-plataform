import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpgradePlanInput {
  @Field()
  tenantId!: string;

  @Field()
  planCode!: string;
}
