import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth/types";
import { getSession } from "@/lib/cms/auth";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireRole(...allowed: UserRole[]) {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!allowed.includes(session.role)) {
    return {
      session,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

export async function requireOwner() {
  return requireRole("owner");
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonErrorFromUnknown(err: unknown, status = 500) {
  console.error(err);
  const message =
    err instanceof Error ? err.message : "Internal server error";
  return jsonError(message, status);
}
