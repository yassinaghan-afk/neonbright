import { authenticateUser } from "@/lib/auth/users";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/cms/session";
import { jsonError, jsonOk } from "@/lib/cms/api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return jsonError("Email and password are required", 400);
  }

  const user = await authenticateUser(body.email, body.password);
  if (!user) {
    return jsonError("Invalid credentials", 401);
  }

  const token = await createSessionToken(user.id, user.role);
  const response = jsonOk({
    success: true,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
