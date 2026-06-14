import { clearSessionCookieOptions } from "@/lib/cms/session";
import { jsonOk } from "@/lib/cms/api";

export async function POST() {
  const response = jsonOk({ success: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}
