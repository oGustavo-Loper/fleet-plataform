import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class DriverModel {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

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

  @Field()
  createdAt!: string;

  @Field({ nullable: true })
  loginEmail?: string;

  @Field(() => [String])
  assignedVehicleIds!: string[];

  @Field()
  allowAnyVehicle!: boolean;

  @Field()
  employmentStatus!: string;

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  photoDataUrl?: string;

  @Field({ nullable: true })
  accountRole?: string;

  @Field()
  hasCompletedFirstLogin!: boolean;
}
