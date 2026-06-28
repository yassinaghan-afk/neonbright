"use client";

import type { HeroContent } from "@/lib/cms/types";

export function HeroPreview({ hero }: { hero: HeroContent }) {
  const block = hero.trustBlock;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050505] p-6">
      <p className="mb-3 text-[10px] uppercase tracking-widest text-neon-pink">Live Preview</p>
      <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/60">
        {hero.badge || "Badge text"}
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-white">
        {hero.headline || "Headline"}{" "}
        <span className="neon-text-gradient">{hero.headlineAccent || "Accent"}</span>
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-white/50">
        {hero.subheadline || "Subheadline text..."}
      </p>
      {block?.enabled !== false && (
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <p className="font-display text-2xl font-bold">{block?.value || "200+"}</p>
          <p className="text-xs text-white/50">{block?.label || "clients satisfaits"}</p>
          {block?.sublabel && (
            <p className="mt-1 text-[10px] text-white/35">{block.sublabel}</p>
          )}
        </div>
      )}
      <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-white/30">
        {hero.trustStripLabel}
      </p>
    </div>
  );
}
