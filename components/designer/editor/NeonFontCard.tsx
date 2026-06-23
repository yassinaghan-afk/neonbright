"use client";

import { cn } from "@/lib/utils";
import type { EditorFont } from "@/lib/designer/fonts";
import { neonCssPreviewStyle } from "@/lib/designer/neonTubeStyles";

type Props = {
  font: EditorFont;
  active: boolean;
  color: string;
  previewText?: string;
  onSelect: () => void;
};

export function NeonFontCard({ font, active, color, previewText, onSelect }: Props) {
  const raw = previewText?.trim() || font.preview;
  const displayText = raw.length > 14 ? `${raw.slice(0, 12)}…` : raw;
  const isRtl = font.rtl;
  const sizeClass = displayText.length > 8 ? "text-base" : "text-lg";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-2xl border transition-all active:scale-[0.97]",
        "min-h-[84px] p-2 text-left",
        active
          ? "border-neon-pink/60 bg-neon-pink/10 ring-2 ring-neon-pink/25"
          : "border-white/10 bg-[#0d0d0d] hover:border-white/25 hover:bg-white/[0.04]"
      )}
    >
      <div className="flex h-[48px] items-center justify-center rounded-xl bg-[#080808] px-2">
        <span
          className={cn("block max-w-full truncate leading-none", sizeClass)}
          dir={isRtl ? "rtl" : "ltr"}
          style={{
            fontFamily: font.family,
            fontWeight: font.weight ?? "normal",
            ...neonCssPreviewStyle(color),
          }}
        >
          {displayText}
        </span>
      </div>
      <span
        className={cn(
          "mt-1.5 block truncate text-[10px] font-medium",
          active ? "text-neon-pink" : "text-white/50"
        )}
      >
        {font.label}
      </span>
    </button>
  );
}
