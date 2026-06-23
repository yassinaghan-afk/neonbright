"use client";

import { cn } from "@/lib/utils";
import { NEON_TUBE_STYLES, type NeonTubeStyle } from "@/lib/designer/neonTubeStyles";

type Props = {
  value: NeonTubeStyle;
  onChange: (style: NeonTubeStyle) => void;
  compact?: boolean;
};

export function NeonStylePicker({ value, onChange, compact }: Props) {
  return (
    <div className="space-y-1.5">
      {!compact && (
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">Style néon</p>
      )}
      <div className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NEON_TUBE_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            title={s.description}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-left transition-all min-h-[44px] active:scale-[0.98] sm:min-h-0 sm:py-1.5",
              value === s.id
                ? "border-neon-pink/60 bg-neon-pink/10 ring-1 ring-neon-pink/25"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            )}
          >
            <span className={cn("block text-[11px] font-medium", value === s.id ? "text-neon-pink" : "text-white/75")}>
              {s.label}
            </span>
            {!compact && (
              <span className="mt-0.5 hidden text-[9px] text-white/40 sm:block">{s.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
