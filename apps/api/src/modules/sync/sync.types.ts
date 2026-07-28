import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SyncResult {
  @Field()
  operationId!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  errorMessage?: string;
}
