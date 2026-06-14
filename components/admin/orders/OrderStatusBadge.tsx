import { cn } from "@/lib/utils";
import { getOrderStatusConfig } from "@/lib/orders/helpers";
import type { OrderStatus } from "@/lib/orders/types";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const config = getOrderStatusConfig(status);
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
