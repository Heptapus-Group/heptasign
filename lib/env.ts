export function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const INSECURE_SECRETS = new Set([
  "change-this-long-random-secret",
  "development-only-secret",
  "secret",
  "changeme"
]);

/**
 * Returns the secret used for session JWTs and metadata HMACs. In production it
 * refuses to start with a missing, placeholder, or too-short secret so a real
 * value must be configured before deploy.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32 || INSECURE_SECRETS.has(secret)) {
      throw new Error(
        "JWT_SECRET must be set to a strong, random value (>= 32 chars) in production."
      );
    }
    return secret;
  }
  return secret || "development-only-secret";
}

export function getAppUrl() {
  return getEnv("APP_URL", "http://localhost:3000").replace(/\/$/, "");
}

export function getStoragePath() {
  return getEnv("STORAGE_PATH", "./storage");
}

export function getMaxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB || "10");
  return Math.max(1, mb) * 1024 * 1024;
}
