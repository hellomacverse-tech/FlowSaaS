/**
 * Sandbox input hygiene (Section 7.3 step 2): strip control characters,
 * cap length, and replace emails/phone numbers with placeholders BEFORE the
 * text can reach any LLM or be stored. Deliberately conservative regexes —
 * this reduces accidental PII exposure, it is not a guarantee.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// 7+ digits, allowing +, spaces, dashes, dots and parens between them.
const PHONE = /(?<![\w])\+?\(?\d[\d\s().-]{5,}\d(?![\w])/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const MAX_SANDBOX_INPUT = 280;

export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS, "");
}

export function scrubPii(input: string): string {
  return input.replace(EMAIL, "[email]").replace(PHONE, (match) => {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 7 ? "[phone]" : match;
  });
}

export function sanitizeSandboxInput(input: string): string {
  return scrubPii(stripControlChars(input)).trim().slice(0, MAX_SANDBOX_INPUT);
}
