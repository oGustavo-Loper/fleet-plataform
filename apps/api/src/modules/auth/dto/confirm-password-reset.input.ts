import { Field, InputType } from "@nestjs/graphql";
import { MinLength } from "class-validator";

@InputType()
export class ConfirmPasswordResetInput {
  @Field()
  email!: string;

  @Field()
  code!: string;

  @Field()
  @MinLength(8)
  newPassword!: string;
}
