"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAlert, AdminButton, AdminCard } from "@/components/admin/ui/AdminForm";
import { useSession } from "@/components/admin/useSession";
import { useCMSContent } from "@/components/admin/useCMS";

type LeadStats = { total: number; new: number };
type OrderStats = { total: number; active: number; in_production: number };

export default function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const { session, isOwner, loading: sessionLoading } = useSession();
  const { content, loading: cmsLoading } = useCMSContent({ enabled: isOwner });
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);

  const denied = searchParams.get("denied") === "1";

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/leads?stats=true").then((r) => r.json()),
      fetch("/api/admin/orders?stats=true").then((r) => r.json()),
    ]).then(([leads, orders]) => {
      setLeadStats(leads);
      setOrderStats(orders);
    });
  }, []);

  const loading = sessionLoading || (isOwner && cmsLoading);

  const stats = [
    { label: "New Leads", count: leadStats?.new ?? 0, href: "/admin/leads?status=new", highlight: true },
    { label: "Active Orders", count: orderStats?.active ?? 0, href: "/admin/orders", highlight: true },
    { label: "In Production", count: orderStats?.in_production ?? 0, href: "/admin/orders?status=in_production" },
    { label: "Total Leads", count: leadStats?.total ?? 0, href: "/admin/leads" },
    ...(isOwner && content
      ? [
          { label: "Projects", count: content.projects.length, href: "/admin/portfolio" },
          { label: "Services", count: content.services.length, href: "/admin/services" },
        ]
      : []),
  ];

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/45">
          {isOwner
            ? "Manage your website content, leads, and orders."
            : "Manage incoming quote requests, leads, and orders."}
        </p>
      </div>

      {denied && (
        <div className="mb-6">
          <AdminAlert type="error" message="You don't have permission to access that section." />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/45">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Link key={s.label} href={s.href}>
                <AdminCard title={s.label}>
                  <p className={`font-display text-3xl font-bold ${"highlight" in s && s.highlight ? "text-neon-pink" : "text-white"}`}>
                    {s.count}
                  </p>
                </AdminCard>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <AdminCard title="Quick Actions" description="Jump to common tasks">
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/leads"><AdminButton variant="secondary">View Leads</AdminButton></Link>
                <Link href="/admin/orders"><AdminButton variant="secondary">View Orders</AdminButton></Link>
                {isOwner && (
                  <>
                    <Link href="/admin/hero"><AdminButton variant="secondary">Edit Hero</AdminButton></Link>
                    <Link href="/admin/seo"><AdminButton variant="secondary">Update SEO</AdminButton></Link>
                  </>
                )}
              </div>
            </AdminCard>
            {isOwner && content ? (
              <AdminCard title="Last Updated">
                <p className="text-sm text-white/60">
                  {content.updatedAt ? new Date(content.updatedAt).toLocaleString() : "—"}
                </p>
                <p className="mt-2 text-xs text-white/35">
                  Content stored in <code className="text-neon-purple">data/cms-content.json</code>
                </p>
              </AdminCard>
            ) : session ? (
              <AdminCard title="Your Access">
                <p className="text-sm text-white/60">
                  Signed in as <span className="text-white">{session.name}</span> with staff access.
                  You can view and manage leads and orders.
                </p>
              </AdminCard>
            ) : null}
          </div>
        </>
      )}
    </AdminShell>
  );
}
