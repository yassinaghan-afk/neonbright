import type { UserRole } from "@/lib/auth/types";

export const SESSION_COOKIE = "neonbright_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.SESSION_SECRET ?? "neonbright-dev-secret-change-me";
}

async function hmacSign(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(
  userId: string,
  role: UserRole
): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}:${role}:${expires}`;
  const signature = await hmacSign(payload);
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  role?: UserRole;
}> {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return { valid: false };

    const payload = Buffer.from(encoded, "base64url").toString("utf-8");
    const expected = await hmacSign(payload);
    if (signature.length !== expected.length) return { valid: false };

    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== expected[i]) match = false;
    }
    if (!match) return { valid: false };

    const parts = payload.split(":");
    if (parts.length !== 3) return { valid: false };

    const [userId, role, expiresStr] = parts;
    const expires = Number(expiresStr);
    if (!userId || !expires || Number.isNaN(expires) || Date.now() > expires) {
      return { valid: false };
    }
    if (role !== "owner" && role !== "staff") return { valid: false };

    return { valid: true, userId, role };
  } catch {
    return { valid: false };
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
