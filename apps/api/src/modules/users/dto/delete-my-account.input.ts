import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class DeleteMyAccountInput {
  @Field()
  password!: string;
}
