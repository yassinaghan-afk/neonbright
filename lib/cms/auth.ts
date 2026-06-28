import { cookies } from "next/headers";
import { getUserById } from "@/lib/auth/users";
import type { SessionUser } from "@/lib/auth/types";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await verifySessionToken(token);
  if (!result.valid || !result.userId || !result.role) return null;

  const user = await getUserById(result.userId);
  if (!user || !user.active || user.role !== result.role) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
}
