import assert from "node:assert/strict";
import test from "node:test";

import { validate } from "class-validator";

import { isValidCnpj, isValidCpf } from "../document-number.js";
import { IsValidCnpj, IsValidCpf } from "./document-number.validator.js";

class CpfHolder {
  @IsValidCpf()
  cpf!: string;
}

class CnpjHolder {
  @IsValidCnpj()
  cnpj!: string;
}

test("isValidCpf accepts a real check-digit-valid CPF regardless of formatting", () => {
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("52998224725"), true);
});

test("isValidCpf rejects a CPF with a wrong check digit", () => {
  assert.equal(isValidCpf("529.982.247-26"), false);
});

test("isValidCpf rejects all-same-digit sequences even though they'd pass the raw checksum", () => {
  assert.equal(isValidCpf("11111111111"), false);
  assert.equal(isValidCpf("00000000000"), false);
});

test("isValidCpf rejects the wrong length", () => {
  assert.equal(isValidCpf("1234567890"), false);
  assert.equal(isValidCpf(""), false);
});

test("isValidCnpj accepts a real all-numeric check-digit-valid CNPJ (legacy format)", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11222333000181"), true);
});

test("isValidCnpj accepts the official alphanumeric worked example from Receita Federal", () => {
  assert.equal(isValidCnpj("AB.12C.D34/EFGH-83"), true);
  assert.equal(isValidCnpj("ab12cd34efgh83"), true, "lowercase letters must be normalized");
});

test("isValidCnpj rejects a wrong check digit on an alphanumeric CNPJ", () => {
  assert.equal(isValidCnpj("AB12CD34EFGH84"), false);
});

test("isValidCnpj rejects letters in the check-digit positions", () => {
  assert.equal(isValidCnpj("AB12CD34EFGHAB"), false);
});

test("isValidCnpj rejects the wrong length", () => {
  assert.equal(isValidCnpj("AB12CD34EFG"), false);
});

test("IsValidCpf decorator flags an invalid CPF on the DTO", async () => {
  const holder = new CpfHolder();
  holder.cpf = "123";

  const errors = await validate(holder);

  assert.equal(errors.length, 1);
  assert.ok(errors[0]?.constraints?.isValidCpf);
});

test("IsValidCpf decorator passes for a real CPF", async () => {
  const holder = new CpfHolder();
  holder.cpf = "529.982.247-25";

  const errors = await validate(holder);

  assert.deepEqual(errors, []);
});

test("IsValidCnpj decorator flags an invalid CNPJ on the DTO", async () => {
  const holder = new CnpjHolder();
  holder.cnpj = "not-a-cnpj";

  const errors = await validate(holder);

  assert.equal(errors.length, 1);
  assert.ok(errors[0]?.constraints?.isValidCnpj);
});

test("IsValidCnpj decorator passes for a real alphanumeric CNPJ", async () => {
  const holder = new CnpjHolder();
  holder.cnpj = "AB.12C.D34/EFGH-83";

  const errors = await validate(holder);

  assert.deepEqual(errors, []);
});
