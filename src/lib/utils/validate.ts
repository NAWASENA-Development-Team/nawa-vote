/**
 * Validation helpers for NAWA-VOTE inputs.
 */

/**
 * Validate NIS (Nomor Induk Siswa).
 * Typically a numeric or alphanumeric code of length 4 to 10.
 */
export function validateNIS(nis: string): boolean {
  if (!nis) return false;
  const cleaned = nis.trim();
  // Standard school NIS is usually numeric and between 4 to 10 digits
  return cleaned.length >= 4 && cleaned.length <= 10 && /^[a-zA-Z0-9]+$/.test(cleaned);
}

/**
 * Validate PIN voting (must be exactly 6 digits numeric).
 */
export function validatePIN(pin: string): boolean {
  if (!pin) return false;
  const cleaned = pin.trim();
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}

/**
 * Validate UUID v4 (Standard Supabase ID and Vote Token format).
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid) return false;
  const cleaned = uuid.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(cleaned);
}
