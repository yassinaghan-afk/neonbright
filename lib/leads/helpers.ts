import type { LeadStatus } from "./types";

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-neon-pink/20 text-neon-pink border-neon-pink/30" },
  { value: "contacted", label: "Contacted", color: "bg-neon-purple/20 text-neon-purple border-neon-purple/30" },
  { value: "quoted", label: "Quoted", color: "bg-neon-blue/20 text-neon-blue border-neon-blue/30" },
  { value: "won", label: "Won", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "lost", label: "Lost", color: "bg-white/10 text-white/50 border-white/20" },
];

export function getStatusConfig(status: LeadStatus) {
  return LEAD_STATUSES.find((s) => s.value === status) ?? LEAD_STATUSES[0];
}

export function labelForProjectType(value: string): string {
  const map: Record<string, string> = {
    "custom-logo-neon": "Custom Logo Neon",
    "restaurant-signage": "Restaurant Signage",
    "hotel-signage": "Hotel Signage",
    "retail-signage": "Retail Signage",
    "event-neon": "Event Neon",
    "corporate-installation": "Corporate Installation",
  };
  return map[value] ?? value;
}

export function labelForBudget(value: string): string {
  const map: Record<string, string> = {
    "under-500": "Under $500",
    "500-1500": "$500 – $1,500",
    "1500-5000": "$1,500 – $5,000",
    "5000-plus": "$5,000+",
  };
  return map[value] ?? value;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
