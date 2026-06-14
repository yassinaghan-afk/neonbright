"use client";

import { cn } from "@/lib/utils";
import { useDesigner } from "../DesignerContext";

export function LayersPanel() {
  const {
    state,
    selectLayer,
    bringForward,
    sendBackward,
    deleteSelected,
  } = useDesigner();

  const sorted = [...state.layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex w-full flex-col rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm md:w-52 md:shrink-0">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Layers</span>
        <span className="text-[10px] text-white/30">{state.layers.length}</span>
      </div>
      <div className="max-h-40 overflow-y-auto p-2 md:max-h-[calc(100dvh-14rem)]">
        {sorted.map((layer) => (
          <button
            key={layer.id}
            type="button"
            onClick={() => selectLayer(layer.id)}
            className={cn(
              "mb-1 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
              state.selectedId === layer.id
                ? "border-neon-pink/40 bg-neon-pink/10 text-white"
                : "border-transparent text-white/55 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="text-[10px] uppercase text-white/30">{layer.type}</span>
            <span className="truncate">{layer.name || layer.text?.slice(0, 16) || "Layer"}</span>
          </button>
        ))}
      </div>
      {state.selectedId && (
        <div className="flex gap-1 border-t border-white/10 p-2">
          <button type="button" onClick={bringForward} className="flex-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/55 hover:text-white">
            ↑ Forward
          </button>
          <button type="button" onClick={sendBackward} className="flex-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/55 hover:text-white">
            ↓ Back
          </button>
          <button type="button" onClick={deleteSelected} className="rounded-lg border border-red-500/30 px-2 py-1.5 text-[10px] text-red-400">
            Del
          </button>
        </div>
      )}
    </div>
  );
}
