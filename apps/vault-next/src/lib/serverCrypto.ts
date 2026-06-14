import crypto from "crypto";
import { SERVER_ENCRYPTION_KEY } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export function encryptServerSide(plaintext: string): string {
  const key = Buffer.from(SERVER_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("SERVER_ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv_hex:auth_tag_hex:encrypted_hex
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptServerSide(ciphertext: string): string {
  // If ciphertext doesn't have colons, it is probably a plaintext legacy key.
  // Return it as-is for backward compatibility/robustness.
  if (!ciphertext.includes(":")) {
    return ciphertext;
  }

  const key = Buffer.from(SERVER_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("SERVER_ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = Buffer.from(parts[2], "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
