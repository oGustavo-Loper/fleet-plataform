export function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/**
 * CNPJ went alphanumeric in July 2026 (IN RFB nº 2.229/2024) — the first
 * 12 characters may now be digits or uppercase letters, only the last 2
 * check digits stay numeric.
 */
export function onlyCnpjChars(value: string, maxLength?: number) {
  const chars = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  return maxLength ? chars.slice(0, maxLength) : chars;
}

export function formatCnpj(value: string) {
  const chars = onlyCnpjChars(value, 14);
  return chars
    .replace(/^([0-9A-Z]{2})([0-9A-Z])/, "$1.$2")
    .replace(/^([0-9A-Z]{2})\.([0-9A-Z]{3})([0-9A-Z])/, "$1.$2.$3")
    .replace(/\.([0-9A-Z]{3})([0-9A-Z])/, ".$1/$2")
    .replace(/([0-9A-Z]{4})([0-9A-Z])/, "$1-$2");
}

export function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export function formatPlate(value: string) {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

  if (clean.length <= 3) {
    return clean;
  }

  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}
