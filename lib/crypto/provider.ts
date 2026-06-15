import crypto from "crypto";
import { getJwtSecret } from "@/lib/env";

export type SignatureRecord = {
  algorithm: string;
  value: string;
};

export interface CryptoProvider {
  hashSha256(data: Buffer): string;
  createVerificationToken(): string;
  signMetadata(data: Record<string, unknown>): SignatureRecord;
  verifyMetadata(data: Record<string, unknown>, signature: SignatureRecord): boolean;
}

export class ClassicalCryptoProvider implements CryptoProvider {
  hashSha256(data: Buffer) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  createVerificationToken() {
    return crypto.randomBytes(32).toString("base64url");
  }

  signMetadata(data: Record<string, unknown>) {
    const value = crypto
      .createHmac("sha256", getJwtSecret())
      .update(JSON.stringify(data))
      .digest("hex");

    return { algorithm: "HMAC-SHA256", value };
  }

  verifyMetadata(data: Record<string, unknown>, signature: SignatureRecord) {
    const expected = this.signMetadata(data);
    if (signature.algorithm !== expected.algorithm) return false;
    // Constant-time comparison to avoid leaking the HMAC via timing.
    const a = Buffer.from(signature.value, "utf8");
    const b = Buffer.from(expected.value, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}

export const cryptoProvider: CryptoProvider = new ClassicalCryptoProvider();
