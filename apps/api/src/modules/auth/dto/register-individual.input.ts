import { Field, InputType } from "@nestjs/graphql";

import { IsValidCpf } from "../../../common/validators/document-number.validator.js";

@InputType()
export class RegisterIndividualInput {
  @Field()
  fullName!: string;

  @Field()
  @IsValidCpf()
  cpf!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  createDriverProfile?: boolean;

  @Field()
  acceptedTermsVersion!: string;
}
