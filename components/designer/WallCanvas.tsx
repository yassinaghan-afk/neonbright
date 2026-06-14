"use client";

import dynamic from "next/dynamic";

const EditorCanvas = dynamic(() => import("./studio/EditorCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[55dvh] items-center justify-center rounded-xl border border-white/10 bg-[#080808]">
      <p className="text-sm text-white/40">Loading editor…</p>
    </div>
  ),
});

export function WallCanvas() {
  return <EditorCanvas />;
}
