import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateCheckoutSessionInput {
  @Field()
  tenantId!: string;

  @Field()
  planCode!: string;
}
