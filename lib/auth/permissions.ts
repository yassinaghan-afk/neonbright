import type { UserRole } from "./types";

/** CMS content + company/SEO — owner only */
export const OWNER_ONLY_ADMIN_PREFIXES = [
  "/admin/hero",
  "/admin/portfolio",
  "/admin/testimonials",
  "/admin/partners",
  "/admin/services",
  "/admin/company",
  "/admin/seo",
];

export const OWNER_ONLY_API_PREFIXES = [
  "/api/admin/content",
  "/api/admin/hero",
  "/api/admin/company",
  "/api/admin/seo",
  "/api/admin/upload",
  "/api/admin/projects",
  "/api/admin/services",
  "/api/admin/testimonials",
  "/api/admin/partners",
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function canAccessAdminPath(role: UserRole, pathname: string): boolean {
  if (role === "owner") return true;
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/leads") ||
    pathname.startsWith("/admin/orders")
  ) {
    return true;
  }
  return !matchesPrefix(pathname, OWNER_ONLY_ADMIN_PREFIXES);
}

export function canAccessApiPath(role: UserRole, pathname: string): boolean {
  if (role === "owner") return true;
  if (pathname.startsWith("/api/admin/leads")) return true;
  if (pathname.startsWith("/api/admin/orders")) return true;
  if (pathname.startsWith("/api/admin/auth/")) return true;
  return !matchesPrefix(pathname, OWNER_ONLY_API_PREFIXES);
}

export function roleLabel(role: UserRole): string {
  return role === "owner" ? "Owner" : "Staff";
}
