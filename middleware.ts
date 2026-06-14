import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessAdminPath,
  canAccessApiPath,
} from "@/lib/auth/permissions";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : { valid: false };

  if (pathname.startsWith("/admin")) {
    if (!session.valid || !session.role) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessAdminPath(session.role, pathname)) {
      const denied = new URL("/admin", request.url);
      denied.searchParams.set("denied", "1");
      return NextResponse.redirect(denied);
    }
  }

  if (
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth/login")
  ) {
    if (!session.valid || !session.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessApiPath(session.role, pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
