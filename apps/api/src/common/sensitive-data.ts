import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { PtBrMessage } from "./messages.js";

const ENCRYPTED_PREFIX = "enc:v1:";
let cachedKey: Buffer | null = null;

function getEncryptionKey() {
  if (cachedKey) {
    return cachedKey;
  }

  const rawKey = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (!rawKey) {
    if (process.env.NODE_ENV === "test") {
      cachedKey = createHash("sha256").update("fleet-test-encryption-key").digest();
      return cachedKey;
    }

    throw new Error(PtBrMessage.DATA_ENCRYPTION_KEY_REQUIRED);
  }

  cachedKey = createHash("sha256").update(rawKey).digest();
  return cachedKey;
}

export function encryptSensitiveValue(value?: string | null) {
  if (!value) {
    return value ?? null;
  }

  if (value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSensitiveValue(value?: string | null) {
  if (!value) {
    return value ?? undefined;
  }

  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    return value;
  }

  const payload = value.slice(ENCRYPTED_PREFIX.length);
  const [ivRaw, authTagRaw, encryptedRaw] = payload.split(":");

  if (!ivRaw || !authTagRaw || !encryptedRaw) {
    return value;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivRaw, "base64")
    );
    decipher.setAuthTag(Buffer.from(authTagRaw, "base64"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64")),
      decipher.final()
    ]);

    return decrypted.toString("utf8");
  } catch {
    return value;
  }
}
