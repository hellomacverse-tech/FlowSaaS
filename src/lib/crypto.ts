import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for secrets we must be able to read back (a customer's n8n
 * API key, Section 7.4). Output is three base64 strings stored in the
 * `api_key_ciphertext / api_key_iv / api_key_tag` columns. GCM's auth tag
 * means a tampered ciphertext fails to decrypt instead of yielding garbage.
 * Pass the key explicitly (rather than importing `env`) so this stays a pure,
 * unit-testable function; `keyId` supports rotation via the `key_id` column.
 */
export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: number;
}

function toKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) throw new Error("Encryption key must be 32 bytes (base64).");
  return key;
}

export function encryptSecret(plaintext: string, keyBase64: string, keyId = 1): EncryptedSecret {
  const iv = randomBytes(12); // 96-bit nonce, the GCM standard; fresh per encryption
  const cipher = createCipheriv("aes-256-gcm", toKey(keyBase64), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    keyId,
  };
}

export function decryptSecret(secret: Pick<EncryptedSecret, "ciphertext" | "iv" | "tag">, keyBase64: string): string {
  const decipher = createDecipheriv("aes-256-gcm", toKey(keyBase64), Buffer.from(secret.iv, "base64"));
  decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** `••••••••abcd` — the only form of a stored key ever sent to the browser. */
export function maskSecret(plaintext: string): string {
  return `••••••••${plaintext.slice(-4)}`;
}
