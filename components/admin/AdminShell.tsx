"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { roleLabel } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import { useSession } from "@/components/admin/useSession";
import { AdminButton } from "@/components/admin/ui/AdminForm";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◫", roles: ["owner", "staff"] },
  { href: "/admin/leads", label: "Leads", icon: "◉", roles: ["owner", "staff"] },
  { href: "/admin/orders", label: "Orders", icon: "◧", roles: ["owner", "staff"] },
  { href: "/admin/hero", label: "Hero", icon: "✦", roles: ["owner"] },
  { href: "/admin/hero-slider", label: "Hero Slider", icon: "▣", roles: ["owner"] },
  { href: "/admin/nav", label: "Navigation", icon: "≡", roles: ["owner"] },
  { href: "/admin/portfolio", label: "Portfolio", icon: "◈", roles: ["owner"], exact: true },
  { href: "/admin/portfolio/events", label: "Events", icon: "◷", roles: ["owner"] },
  { href: "/admin/portfolio/brands", label: "Brands", icon: "◉", roles: ["owner"] },
  { href: "/admin/brands-logos", label: "Logos Marques", icon: "◎", roles: ["owner"] },
  { href: "/admin/features", label: "Avantages", icon: "◆", roles: ["owner"] },
  { href: "/admin/industries", label: "Secteurs", icon: "🏭", roles: ["owner"] },
  { href: "/admin/process", label: "Processus", icon: "◎", roles: ["owner"] },
  { href: "/admin/testimonials", label: "Témoignages", icon: "◉", roles: ["owner"] },
  { href: "/admin/faq", label: "FAQ", icon: "?", roles: ["owner"] },
  { href: "/admin/section-copy", label: "Textes sections", icon: "✎", roles: ["owner"] },
  { href: "/admin/instagram", label: "Instagram", icon: "◑", roles: ["owner"] },
  { href: "/admin/media", label: "Médiathèque", icon: "🖼", roles: ["owner"], exact: true },
  { href: "/admin/media/logos", label: "Logos partenaires", icon: "◎", roles: ["owner"] },
  { href: "/admin/services", label: "Services (court)", icon: "◇", roles: ["owner"] },
  { href: "/admin/company", label: "Entreprise", icon: "◇", roles: ["owner"] },
  { href: "/admin/settings/social-contact", label: "Social & Contact", icon: "◎", roles: ["owner"] },
  { href: "/admin/seo", label: "SEO", icon: "◐", roles: ["owner"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const visibleNav = session
    ? NAV.filter((item) => item.roles.includes(session.role))
    : NAV.filter((item) => item.roles.includes("owner"));

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-[#0a0a0a] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo href="/admin" variant="compact" />
          <p className="mt-2 text-[10px] uppercase tracking-widest text-white/35">CMS Admin</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname === item.href || (!item.exact && item.href !== "/admin" && pathname.startsWith(item.href))
                  ? "bg-neon-pink/15 text-neon-pink"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="text-xs opacity-60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-2">
          {!loading && session && (
            <div className="rounded-lg px-3 py-2">
              <p className="truncate text-xs font-medium text-white/80">{session.name}</p>
              <p className="truncate text-[10px] text-white/40">{session.email}</p>
              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
                {roleLabel(session.role)}
              </span>
            </div>
          )}
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-xs text-white/45 hover:text-white">
            View Website →
          </Link>
          <AdminButton variant="ghost" className="w-full justify-start text-xs" onClick={logout}>
            Sign Out
          </AdminButton>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo href="/admin" variant="compact" />
            <span className="font-display text-xs font-semibold text-white/60">CMS</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {!loading && session && (
              <span className="hidden text-xs text-white/45 sm:inline">
                {session.name} · {roleLabel(session.role)}
              </span>
            )}
            <AdminButton variant="secondary" className="text-xs lg:hidden" onClick={logout}>
              Sign Out
            </AdminButton>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
