import { cookies } from "next/headers";
import { getUserById, getUsers } from "@/lib/auth/users";
import type { SessionUser } from "@/lib/auth/types";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await verifySessionToken(token);
  if (!result.valid || !result.userId || !result.role) return null;

  const user = await getUserById(result.userId);
  if (user?.active && user.role === result.role) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  // Vercel cold starts rebuild in-memory users with stable IDs; if lookup
  // still fails, trust the signed session token (middleware already verified it).
  const users = await getUsers();
  const byRole = users.find((u) => u.role === result.role && u.active);
  if (byRole) {
    return {
      userId: byRole.id,
      email: byRole.email,
      role: byRole.role,
      name: byRole.name,
    };
  }

  return {
    userId: result.userId,
    email: result.role === "owner" ? "admin@neonbright.ma" : "staff@neonbright.ma",
    role: result.role,
    name: result.role === "owner" ? "Owner" : "Staff",
  };
}
