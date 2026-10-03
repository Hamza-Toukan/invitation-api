/**
 * Normalizes phone numbers to standard E.164 format.
 * Specifically handles Jordanian local prefixes (079, 078, 077) and converts them to +962.
 */
export function normalizePhoneNumber(phone: string): string {
  // Strip whitespace, dashes, parentheses
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');

  // Handle 00962 -> +962
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Jordanian national format: 07[789]xxxxxxx -> +9627[789]xxxxxxx
  if (/^07[789]\d{7}$/.test(cleaned)) {
    return `+962${cleaned.slice(1)}`;
  }

  // Jordanian format without leading 0: 7[789]xxxxxxx -> +9627[789]xxxxxxx
  if (/^7[789]\d{7}$/.test(cleaned)) {
    return `+962${cleaned}`;
  }

  // Jordanian with 962 without +: 9627[789]xxxxxxx -> +9627[789]xxxxxxx
  if (/^9627[789]\d{7}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // If already starts with +, return as-is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  return `+${cleaned}`;
}
