import { Field, InputType } from "@nestjs/graphql";
import { IsOptional } from "class-validator";

import { IsValidCpf } from "../../../common/validators/document-number.validator.js";

@InputType()
export class CreateDriverInput {
  @Field()
  tenantId!: string;

  @Field()
  fullName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsValidCpf()
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
