/**
 * Kept in sync by hand with packages/shared-validation/src/index.ts.
 * That package can't be imported here at runtime: it ships as raw .ts
 * (no build step, `main` points straight at src/index.ts), which Vite
 * transpiles on the fly for apps/web but plain Node — what `nest start`
 * and the built dist/ actually run on — can't load directly. Fixing that
 * would mean giving the shared package a real build step, wiring it into
 * the dev/prod pipelines, and touching how apps/api resolves workspace
 * deps at runtime — out of scope for a validation helper, so this is a
 * deliberate, small, stable-algorithm duplication instead.
 */

function checkDigitFromRemainder(remainder: number): number {
  return remainder < 2 ? 0 : 11 - remainder;
}

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
