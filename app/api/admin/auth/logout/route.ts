import { clearSessionCookieOptions } from "@/lib/cms/session";
import { jsonError, jsonOk } from "@/lib/cms/api";

export async function POST() {
  try {
    const response = jsonOk({ success: true });
    response.cookies.set(clearSessionCookieOptions());
    return response;
  } catch (err) {
    console.error("[api/admin/auth/logout]", err);
    return jsonError("Logout failed", 500);
  }
}
