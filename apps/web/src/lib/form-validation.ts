import { onlyDigits } from "./masks";

export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasMinDigits(value: string, min: number) {
  return onlyDigits(value).length >= min;
}
