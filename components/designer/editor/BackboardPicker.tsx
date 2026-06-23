"use client";

import { cn } from "@/lib/utils";
import { normalizeBackboardType, type BackboardType } from "@/lib/designer/backboards";
import { neonCssPreviewStyle } from "@/lib/designer/neonTubeStyles";

const NEON_STYLE = neonCssPreviewStyle("#ff2d95");

const SIMPLE_SUPPORTS: {
  id: BackboardType;
  label: string;
  subtitle: string;
}[] = [
  {
    id: "none",
    label: "No Support",
    subtitle: "Floating neon only",
  },
  {
    id: "transparent-acrylic-offset",
    label: "Transparent Plexiglass",
    subtitle: "Clear acrylic panel behind sign",
  },
  {
    id: "black-acrylic",
    label: "Black Acrylic",
    subtitle: "Premium glossy black",
  },
  {
    id: "white-acrylic",
    label: "White Acrylic",
    subtitle: "Clean white panel",
  },
];

function NeonText({ text = "NEON", small }: { text?: string; small?: boolean }) {
  return (
    <span
      className={cn("relative z-10 font-normal leading-none tracking-wide", small ? "text-xs" : "text-sm")}
      style={NEON_STYLE}
    >
      {text}
    </span>
  );
}

function SupportPreview({ type }: { type: BackboardType }) {
  const t = normalizeBackboardType(type);
  return (
    <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-[#181818]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-conic-gradient(#252525 0% 25%, #1a1a1a 0% 50%) 50% / 12px 12px",
        }}
      />

      {t === "none" && <NeonText />}

      {(t === "transparent-acrylic" || t === "transparent-acrylic-offset") && (
        <>
          <div
            className="absolute inset-5 rounded-md border border-white/12 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 55%, rgba(255,255,255,0) 100%)",
            }}
          />
          <NeonText />
        </>
      )}

      {t === "black-acrylic" && (
        <>
          <div className="absolute inset-4 rounded-lg bg-black/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/6" />
          <NeonText />
        </>
      )}

      {t === "white-acrylic" && (
        <>
          <div className="absolute inset-4 rounded-lg bg-white/90 shadow-sm ring-1 ring-white/15" />
          <NeonText />
        </>
      )}
    </div>
  );
}

type Props = {
  value: BackboardType | string;
  onChange: (type: BackboardType) => void;
};

export function BackboardPicker({ value, onChange }: Props) {
  const normalized = normalizeBackboardType(value);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SIMPLE_SUPPORTS.map((opt) => {
          const active = normalized === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "flex min-h-[140px] flex-col rounded-2xl border p-2 text-left transition-all active:scale-[0.97]",
                active
                  ? "border-neon-pink/60 bg-neon-pink/10 ring-2 ring-neon-pink/25"
                  : "border-white/10 bg-[#0d0d0d] hover:border-white/25"
              )}
            >
              <SupportPreview type={opt.id} />
              <div className="mt-2 flex-1 px-0.5">
                <p className={cn("text-[11px] font-semibold leading-tight", active ? "text-neon-pink" : "text-white/85")}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[9px] leading-tight text-white/35">{opt.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
