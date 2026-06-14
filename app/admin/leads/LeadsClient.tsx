"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadStatusBadge } from "@/components/admin/leads/LeadStatusBadge";
import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui/AdminForm";
import {
  formatDate,
  labelForBudget,
  labelForProjectType,
  LEAD_STATUSES,
} from "@/lib/leads/helpers";
import type { Lead, LeadStatus } from "@/lib/leads/types";

type LeadStats = {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  won: number;
  lost: number;
};

export default function AdminLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  const status = (searchParams.get("status") ?? "all") as LeadStatus | "all";
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);

    const [leadsRes, statsRes] = await Promise.all([
      fetch(`/api/admin/leads?${params}`),
      fetch("/api/admin/leads?stats=true"),
    ]);

    setLeads(await leadsRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateFilters = (next: { status?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
    }
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    router.push(`/admin/leads?${params.toString()}`);
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Leads</h1>
        <p className="text-sm text-white/45">Quote requests from the website</p>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "new", label: "New", count: stats.new },
            { key: "contacted", label: "Contacted", count: stats.contacted },
            { key: "quoted", label: "Quoted", count: stats.quoted },
            { key: "won", label: "Won", count: stats.won },
            { key: "lost", label: "Lost", count: stats.lost },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => updateFilters({ status: s.key })}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                status === s.key
                  ? "border-neon-pink/40 bg-neon-pink/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <p className="font-display text-xl font-bold">{s.count}</p>
              <p className="text-[11px] text-white/45">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      <AdminCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminInput
            placeholder="Search name, email, company, reference..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters({ search: searchInput })}
            className="flex-1"
          />
          <AdminSelect
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="sm:w-40"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </AdminSelect>
          <AdminButton variant="secondary" onClick={() => updateFilters({ search: searchInput })}>
            Search
          </AdminButton>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-white/45">Loading leads...</p>
        ) : leads.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/45">No leads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                  <th className="pb-3 pr-4 font-medium">Reference</th>
                  <th className="pb-3 pr-4 font-medium">Contact</th>
                  <th className="pb-3 pr-4 font-medium">Country</th>
                  <th className="pb-3 pr-4 font-medium">Project</th>
                  <th className="pb-3 pr-4 font-medium">Budget</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pr-4">
                      <Link href={`/admin/leads/${lead.id}`} className="font-mono text-xs text-neon-pink hover:underline">
                        {lead.reference}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/leads/${lead.id}`} className="block hover:text-neon-pink">
                        <span className="font-medium">{lead.fullName}</span>
                        {lead.companyName && <span className="block text-xs text-white/45">{lead.companyName}</span>}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-white/60">{lead.country || "—"}</td>
                    <td className="py-3 pr-4 text-white/60">{labelForProjectType(lead.projectType) || "—"}</td>
                    <td className="py-3 pr-4 text-white/60">{labelForBudget(lead.budgetRange) || "—"}</td>
                    <td className="py-3 pr-4"><LeadStatusBadge status={lead.status} /></td>
                    <td className="py-3 text-xs text-white/45">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
