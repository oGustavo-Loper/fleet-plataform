import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class InviteUserInput {
  @Field()
  tenantId!: string;

  @Field()
  email!: string;

  @Field()
  fullName!: string;
}
