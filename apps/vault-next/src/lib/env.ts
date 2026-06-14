/**
 * Centralized, validated environment variable access.
 * Throws at startup if required variables are missing — preventing silent misconfigurations.
 */

function requireEnv(key: string, devDefault?: string): string {
  const value = process.env[key];
  if (value) return value;

  if (process.env.NODE_ENV !== "production" && devDefault !== undefined) {
    console.warn(
      `[env] WARNING: ${key} is not set. Using dev default: "${devDefault}". Set this in production.`
    );
    return devDefault;
  }

  throw new Error(
    `[env] Missing required environment variable: "${key}". ` +
      `See SELF_HOSTING.md for setup instructions.`
  );
}

// Auth
export const JWT_SECRET = requireEnv("JWT_SECRET");

// WebAuthn — required in production, dev defaults to localhost
export const RP_ID = requireEnv("RP_ID", "localhost");
export const ORIGIN = requireEnv("ORIGIN", "http://localhost:3000");

// Rate limiting (optional — enables Upstash Redis when set)
export const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Server-side encryption key for sensitive fields (e.g. 2FA secrets)
// Generate with: openssl rand -hex 32
export const SERVER_ENCRYPTION_KEY = requireEnv(
  "SERVER_ENCRYPTION_KEY",
  "00000000000000000000000000000000000000000000000000000000000000ff" // dev-only placeholder
);
