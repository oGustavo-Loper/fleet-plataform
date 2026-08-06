import { z } from "zod";

function checkDigitFromRemainder(remainder: number): number {
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * CPF check-digit validation (Módulo 11). Purely numeric, 11 digits —
 * unlike CNPJ, the CPF format was not changed by the 2026 alphanumeric
 * CNPJ rollout.
 */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const calcDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((total, char, index) => total + Number(char) * weights[index], 0);
    return checkDigitFromRemainder(sum % 11);
  };

  const base = digits.slice(0, 9);
  const dv1 = calcDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calcDigit(base + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits === `${base}${dv1}${dv2}`;
}

/**
 * CNPJ check-digit validation (Módulo 11), updated for the alphanumeric
 * CNPJ format (Instrução Normativa RFB nº 2.229/2024, in effect since
 * July 2026): the first 12 characters may be digits or uppercase letters,
 * the last 2 check digits remain numeric. Each character's value for the
 * checksum is its ASCII code minus 48 (digits '0'-'9' -> 0-9, letters
 * 'A'-'Z' -> 17-42) — this also keeps every pre-existing all-numeric CNPJ
 * valid under the same formula.
 */
export function isValidCnpj(value: string): boolean {
  const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(clean)) {
    return false;
  }

  const charValue = (char: string) => char.charCodeAt(0) - 48;
  const calcDigit = (base: string, weights: number[]) => {
    const sum = base
      .split("")
      .reduce((total, char, index) => total + charValue(char) * weights[index], 0);
    return checkDigitFromRemainder(sum % 11);
  };

  const base = clean.slice(0, 12);
  const providedDv = clean.slice(12);
  const dv1 = calcDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calcDigit(base + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return providedDv === `${dv1}${dv2}`;
}

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8)
});

export const vehicleSchema = z.object({
  plate: z.string().min(7).max(8),
  brand: z.string().min(2),
  model: z.string().min(2),
  year: z.number().int().min(1900),
  fuelType: z.enum([
    "GASOLINE",
    "ETHANOL",
    "DIESEL",
    "FLEX",
    "ELECTRIC",
    "HYBRID"
  ]),
  currentKm: z.number().nonnegative(),
  ownerName: z.string().min(2)
});

export const syncQueueItemSchema = z.object({
  id: z.string().uuid(),
  operationId: z.string().uuid(),
  entity: z.enum(["vehicle", "odometer", "fuel", "maintenance"]),
  operation: z.enum(["create", "update"]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  status: z.enum(["pending", "processing", "synced", "conflict"])
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type SyncQueueItemInput = z.infer<typeof syncQueueItemSchema>;
