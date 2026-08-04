import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateDriverInput {
  @Field()
  tenantId!: string;

  @Field()
  fullName!: string;

  @Field({ nullable: true })
  cpf?: string;

  @Field({ nullable: true })
  registrationId?: string;

  @Field({ nullable: true })
  cnh?: string;

  @Field({ nullable: true })
  cnhCategory?: string;

  @Field({ nullable: true })
  cnhExpiresAt?: string;

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
