import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateMyProfileInput {
  @Field()
  fullName!: string;

  @Field({ nullable: true })
  photoDataUrl?: string;

  @Field({ nullable: true })
  currentPassword?: string;

  @Field({ nullable: true })
  newPassword?: string;
}
