"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import {
  AdminButton,
  AdminCard,
  AdminInput,
  AdminSelect,
} from "@/components/admin/ui/AdminForm";
import {
  formatDateTime,
  formatOrderDate,
  labelForProjectType,
  ORDER_STATUSES,
} from "@/lib/orders/helpers";
import type { Order, OrderStatus } from "@/lib/orders/types";

type OrderStats = {
  total: number;
  pending: number;
  design: number;
  in_production: number;
  ready: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  active: number;
};

export default function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const status = (searchParams.get("status") ?? "all") as OrderStatus | "all";
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);

    const [ordersRes, statsRes] = await Promise.all([
      fetch(`/api/admin/orders?${params}`),
      fetch("/api/admin/orders?stats=true"),
    ]);

    setOrders(await ordersRes.json());
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
    router.push(`/admin/orders?${params.toString()}`);
  };

  const statCards = stats
    ? [
        { key: "all", label: "All", count: stats.total },
        { key: "active", label: "Active", count: stats.active },
        { key: "pending", label: "Pending", count: stats.pending },
        { key: "in_production", label: "Production", count: stats.in_production },
        { key: "shipped", label: "Shipped", count: stats.shipped },
        { key: "delivered", label: "Delivered", count: stats.delivered },
      ]
    : [];

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-white/45">Production and delivery pipeline</p>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() =>
                updateFilters({ status: s.key === "active" ? "all" : s.key })
              }
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                status === s.key || (s.key === "active" && status === "all")
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
            placeholder="Search order #, customer, lead ref..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && updateFilters({ search: searchInput })
            }
            className="flex-1"
          />
          <AdminSelect
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="sm:w-44"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </AdminSelect>
          <AdminButton
            variant="secondary"
            onClick={() => updateFilters({ search: searchInput })}
          >
            Search
          </AdminButton>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-white/45">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/45">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                  <th className="pb-3 pr-4 font-medium">Order #</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Project</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Est. Delivery</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-neon-pink hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="block text-[10px] text-white/35">
                        {order.leadReference}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="block hover:text-neon-pink"
                      >
                        <span className="font-medium">{order.customer.fullName}</span>
                        {order.customer.companyName && (
                          <span className="block text-xs text-white/45">
                            {order.customer.companyName}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-white/60">
                      {labelForProjectType(order.project.projectType) || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/45">
                      {formatOrderDate(order.estimatedDeliveryDate)}
                    </td>
                    <td className="py-3 text-xs text-white/45">
                      {formatDateTime(order.createdAt)}
                    </td>
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
