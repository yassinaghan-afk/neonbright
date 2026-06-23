"use client";

import { cn } from "@/lib/utils";
import {
  WALL_PRESETS,
  FEATURED_WALL_IDS,
  wallPresetGradient,
  type WallPreset,
} from "@/lib/designer/wallPresets";

const WALL_LABELS: Record<string, string> = {
  "transparent-bg": "Transparent",
  "coffee-shop": "Café Wall",
  "clothing-store": "Clothing Store",
  "night-club": "Nightclub",
  "home-interior": "Home Interior",
  restaurant: "Restaurant",
  bar: "Bar",
  "gaming-room": "Gaming Room",
  office: "Office",
};

type Props = {
  selectedId: string | null;
  customActive: boolean;
  onSelect: (presetId: string) => void;
  onUpload: () => void;
};

function WallCard({
  w,
  active,
  onSelect,
}: {
  w: WallPreset;
  active: boolean;
  onSelect: () => void;
}) {
  const label = WALL_LABELS[w.id] ?? w.label;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-2xl border text-left transition-all active:scale-[0.97]",
        active
          ? "border-white/40 ring-2 ring-white/20"
          : "border-white/10 hover:border-white/25"
      )}
    >
      <div className="relative h-24 w-full" style={{ background: wallPresetGradient(w) }}>
        {w.texture === "checkerboard" && (
          <div
            className="absolute inset-0"
            style={{
              background: "repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 14px 14px",
            }}
          />
        )}
        {!w.transparent && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(0,0,0,0)_35%,rgba(0,0,0,0.35)_100%)]" />
            <div
              className="absolute bottom-3 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full opacity-70"
              style={{ backgroundColor: w.accent, boxShadow: `0 0 8px ${w.accent}88` }}
            />
          </>
        )}
        {active && (
          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-black shadow-lg">
            ✓
          </div>
        )}
      </div>
      <p className={cn("px-2 py-2 text-[11px] font-medium", active ? "text-white" : "text-white/65")}>
        {label}
      </p>
    </button>
  );
}

export function WallScenePicker({ selectedId, customActive, onSelect, onUpload }: Props) {
  const featured = FEATURED_WALL_IDS.map((id) => WALL_PRESETS.find((p) => p.id === id)).filter(
    Boolean
  ) as WallPreset[];
  const more = WALL_PRESETS.filter((p) => !FEATURED_WALL_IDS.includes(p.id as (typeof FEATURED_WALL_IDS)[number]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {featured.map((w) => (
          <WallCard
            key={w.id}
            w={w}
            active={!customActive && selectedId === w.id}
            onSelect={() => onSelect(w.id)}
          />
        ))}
        <button
          type="button"
          onClick={onUpload}
          className={cn(
            "group relative overflow-hidden rounded-2xl border text-left transition-all active:scale-[0.97]",
            customActive
              ? "border-white/40 ring-2 ring-white/20"
              : "border-dashed border-white/10 hover:border-white/25"
          )}
        >
          <div className="flex h-24 w-full items-center justify-center bg-white/[0.02]">
            <div className="text-center">
              <div className="text-2xl text-white/25">+</div>
              <div className="mt-0.5 text-[10px] text-white/30">Upload</div>
            </div>
          </div>
          <p className={cn("px-2 py-2 text-[11px] font-medium", customActive ? "text-white" : "text-white/45")}>
            My Photo
          </p>
        </button>
      </div>

      {more.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-white/35">More scenes</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {more.map((w) => (
              <WallCard
                key={w.id}
                w={w}
                active={!customActive && selectedId === w.id}
                onSelect={() => onSelect(w.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
