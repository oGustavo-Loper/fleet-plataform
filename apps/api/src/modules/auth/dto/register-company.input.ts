import { Field, InputType } from "@nestjs/graphql";

import { IsValidCnpj } from "../../../common/validators/document-number.validator.js";

@InputType()
export class RegisterCompanyInput {
  @Field()
  companyName!: string;

  @Field()
  @IsValidCnpj()
  cnpj!: string;

  @Field()
  adminFullName!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  photoDataUrl?: string;

  @Field()
  acceptedTermsVersion!: string;
}
