import { registerDecorator, ValidationOptions } from "class-validator";

import { isValidCnpj, isValidCpf } from "../document-number.js";
import { PtBrMessage } from "../messages.js";

export function IsValidCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidCpf",
      target: object.constructor,
      propertyName,
      options: { message: PtBrMessage.CPF_INVALID, ...validationOptions },
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && isValidCpf(value);
        }
      }
    });
  };
}

export function IsValidCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidCnpj",
      target: object.constructor,
      propertyName,
      options: { message: PtBrMessage.CNPJ_INVALID, ...validationOptions },
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && isValidCnpj(value);
        }
      }
    });
  };
}
