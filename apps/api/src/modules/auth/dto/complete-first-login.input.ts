import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CompleteFirstLoginInput {
  @Field()
  email!: string;

  @Field()
  currentPassword!: string;

  @Field()
  newPassword!: string;
}
