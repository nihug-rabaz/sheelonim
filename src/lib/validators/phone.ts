export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  if (digits.length === 9 && digits.startsWith("5")) digits = "0" + digits;
  return digits;
}

export function isValidIsraeliPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return /^05\d{8}$/.test(phone);
}

export function formatPhoneDisplay(value: string): string {
  const phone = normalizePhone(value);
  if (phone.length !== 10) return value;
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
}
