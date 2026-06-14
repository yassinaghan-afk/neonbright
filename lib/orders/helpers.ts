import type { OrderStatus } from "./types";

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  color: string;
}[] = [
  { value: "pending", label: "Pending", color: "bg-white/10 text-white/60 border-white/20" },
  { value: "design", label: "Design", color: "bg-neon-purple/20 text-neon-purple border-neon-purple/30" },
  { value: "in_production", label: "In Production", color: "bg-neon-blue/20 text-neon-blue border-neon-blue/30" },
  { value: "ready", label: "Ready", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "shipped", label: "Shipped", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { value: "delivered", label: "Delivered", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export function getOrderStatusConfig(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

export function formatOrderDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export { labelForBudget, labelForProjectType } from "@/lib/leads/helpers";
