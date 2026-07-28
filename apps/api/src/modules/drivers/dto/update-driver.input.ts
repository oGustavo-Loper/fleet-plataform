import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class UpdateDriverInput {
  @Field()
  id!: string;

  @Field()
  fullName!: string;

  @Field({ nullable: true })
  cpf?: string;

  @Field({ nullable: true })
  registrationId?: string;

  @Field()
  cnh!: string;

  @Field()
  cnhCategory!: string;

  @Field()
  cnhExpiresAt!: string;

  @Field({ nullable: true })
  loginEmail?: string;

  @Field(() => [String], { nullable: true })
  assignedVehicleIds?: string[];

  @Field({ nullable: true })
  allowAnyVehicle?: boolean;

  @Field({ nullable: true })
  employmentStatus?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  photoDataUrl?: string;
}
