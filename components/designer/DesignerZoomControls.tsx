"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ZOOM_PRESETS } from "@/lib/designer/constants";
import { useDesigner } from "./DesignerContext";

export function DesignerZoomControls({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { state, setCanvasZoom, zoomIn, zoomOut, fitToScreen } = useDesigner();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pct = Math.round(state.canvasZoom * 100);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative flex items-center gap-0.5", className)}>
      <button
        type="button"
        onClick={zoomOut}
        className={cn(
          "rounded-md text-white/60 hover:bg-white/5 hover:text-white",
          compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        )}
        aria-label="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "rounded-md text-center font-mono text-white/60 hover:bg-white/5 hover:text-white",
          compact ? "min-w-[2.5rem] px-1 py-0.5 text-[10px]" : "min-w-[3.25rem] px-1.5 py-1 text-[11px]"
        )}
      >
        {pct}%
      </button>

      <button
        type="button"
        onClick={zoomIn}
        className={cn(
          "rounded-md text-white/60 hover:bg-white/5 hover:text-white",
          compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"
        )}
        aria-label="Zoom in"
      >
        +
      </button>

      {!compact && (
      <button
        type="button"
        onClick={fitToScreen}
        title="Fit to screen"
        className="ml-0.5 rounded-md px-2 py-1 text-[10px] text-white/50 hover:bg-white/5 hover:text-white"
      >
        Fit
      </button>
      )}
      {compact && (
        <button
          type="button"
          onClick={fitToScreen}
          title="Fit to screen"
          className="rounded-md px-1.5 py-0.5 text-[9px] text-white/50 hover:bg-white/5 hover:text-white"
        >
          Fit
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[120px] rounded-xl border border-white/10 bg-[#111] py-1 shadow-xl">
          {ZOOM_PRESETS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => {
                setCanvasZoom(z);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-3 py-2 text-left text-xs hover:bg-white/5",
                Math.abs(state.canvasZoom - z) < 0.02 ? "text-neon-pink" : "text-white/70"
              )}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
