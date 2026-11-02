import { HttpRequest } from "@azure/functions";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { HttpError, requireEnv } from "./http";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function tokenSecret(): string {
  const secret = requireEnv("TOKEN_SECRET");
  if (secret.length < 32) throw new Error("TOKEN_SECRET must be at least 32 characters");
  return secret;
}

export function hashIdentity(value: string): string {
  return createHmac("sha256", requireEnv("HASH_SALT")).update(value).digest("hex").slice(0, 32);
}

export function verifyPasscode(input: string): boolean {
  const given = createHash("sha256").update(input).digest();
  const expected = createHash("sha256").update(requireEnv("ADMIN_PASSCODE")).digest();
  return timingSafeEqual(given, expected);
}

const sign = (payload: string) => createHmac("sha256", tokenSecret()).update(payload).digest("base64url");

export function issueToken(facilitator: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ f: facilitator, exp: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyToken(token: string | null): { facilitator: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.f !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { facilitator: data.f };
  } catch {
    return null;
  }
}

// Custom header because SWA reserves the Authorization header for its own auth.
export function requireAdmin(req: HttpRequest): { facilitator: string } {
  const session = verifyToken(req.headers.get("x-admin-token"));
  if (!session) throw new HttpError(401, "Admin session expired. Please sign in again.");
  return session;
}
