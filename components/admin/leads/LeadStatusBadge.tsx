import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/leads/helpers";
import type { LeadStatus } from "@/lib/leads/types";

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
