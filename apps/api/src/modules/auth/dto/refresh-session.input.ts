import { Field, InputType } from "@nestjs/graphql";
import { IsString } from "class-validator";

@InputType()
export class RefreshSessionInput {
  @Field()
  @IsString()
  refreshToken!: string;
}
