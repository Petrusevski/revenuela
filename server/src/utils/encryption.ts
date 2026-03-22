import crypto from "crypto";

const rawKey = process.env.SECRET_ENCRYPTION_KEY;

if (!rawKey || rawKey.length < 32) {
  throw new Error(
    "SECRET_ENCRYPTION_KEY env variable is missing or too short. " +
    "Set a 64-char hex string (crypto.randomBytes(32).toString('hex'))."
  );
}

const ALGO = "aes-256-gcm";

// Derive a 32-byte key from the env value using SHA-256
const key = crypto.createHash("sha256").update(rawKey).digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(enc: string): string {
  const parts = enc.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivHex, tagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
