import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class ConfirmBillingPaymentInput {
  @Field()
  tenantId!: string;

  @Field()
  planCode!: string;

  @Field({ nullable: true })
  paymentId?: string;

  @Field({ nullable: true })
  status?: string;
}
