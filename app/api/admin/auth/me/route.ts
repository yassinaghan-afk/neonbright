import { getSession } from "@/lib/cms/auth";
import { jsonError, jsonOk } from "@/lib/cms/api";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);
  return jsonOk({
    email: session.email,
    role: session.role,
    name: session.name,
  });
}
