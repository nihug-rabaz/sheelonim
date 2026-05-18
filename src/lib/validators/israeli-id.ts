export function normalizeIsraeliId(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.padStart(9, "0").slice(-9);
}

export function isValidIsraeliId(value: string): boolean {
  const id = normalizeIsraeliId(value);
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(id[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}
