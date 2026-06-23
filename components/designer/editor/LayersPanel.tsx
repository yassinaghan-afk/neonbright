"use client";

import { cn } from "@/lib/utils";
import { useDesigner } from "../DesignerContext";
import { LayerActions } from "./LayerActions";

type Props = {
  embedded?: boolean;
};

export function LayersPanel({ embedded }: Props) {
  const {
    state,
    selectLayer,
    bringForward,
    sendBackward,
    deleteSelected,
    duplicateSelected,
  } = useDesigner();

  const sorted = [...state.layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        !embedded && "rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm md:w-52 md:shrink-0"
      )}
    >
      <LayerActions className="mb-2" />

      <div
        className={cn(
          "overflow-y-auto",
          embedded ? "max-h-[40vh]" : "max-h-40 p-2 md:max-h-[calc(100dvh-14rem)]"
        )}
      >
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
        <div className="mt-2 flex gap-1 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={bringForward}
            className="flex-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/55 hover:text-white"
          >
            ↑ Forward
          </button>
          <button
            type="button"
            onClick={sendBackward}
            className="flex-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/55 hover:text-white"
          >
            ↓ Back
          </button>
          <button
            type="button"
            onClick={duplicateSelected}
            className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white/55 hover:text-white"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            className="rounded-lg border border-red-500/30 px-2 py-1.5 text-[10px] text-red-400"
          >
            Del
          </button>
        </div>
      )}
    </div>
  );
}
