import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class RegisterCompanyInput {
  @Field()
  companyName!: string;

  @Field()
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
