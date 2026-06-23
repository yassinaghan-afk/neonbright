"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { DISPLAY_MODES, TUBE_STYLE_DEFAULT, type DisplayMode } from "@/lib/designer/neonTubeStyles";
import { useDesigner } from "./DesignerContext";
import { DesignerHistoryControls } from "./DesignerHistoryControls";
import { DesignerZoomControls } from "./DesignerZoomControls";
import type { PanelId } from "./editor/EditorPanels";
import type { NeonLayer } from "@/lib/designer/editor/types";

type Props = {
  onOpenPanel?: (id: PanelId) => void;
  mobile?: boolean;
};

function useActiveLayer() {
  const { state } = useDesigner();
  return (
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0] ??
    null
  );
}

function MiniSlider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <div className="flex items-center justify-between gap-2 text-[9px] text-white/45">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-mono text-white/55">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full min-w-[72px] accent-white"
      />
    </div>
  );
}

export function DesignerToolbar({ onOpenPanel, mobile }: Props) {
  const { state, updateLayer, setDisplayMode } = useDesigner();
  const active = useActiveLayer();

  const patch = useCallback(
    (p: Partial<NeonLayer>) => {
      if (active) updateLayer(active.id, p);
    },
    [active, updateLayer]
  );

  if (mobile) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 bg-[#0a0a0a] px-2 py-1.5">
        <DesignerHistoryControls compact />
        <span className="truncate text-[10px] text-white/35">Tap text to edit · Double-tap to type</span>
        <DesignerZoomControls className="flex shrink-0" compact />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/8 bg-[#0a0a0a] px-3 py-2">
      <DesignerHistoryControls />
      <div className="hidden h-5 w-px bg-white/10 sm:block" />
      <DesignerZoomControls className="hidden sm:flex" />

      {active?.type === "text" && (
        <>
          <div className="hidden h-5 w-px bg-white/10 md:block" />
          <div className="hidden items-center gap-1 rounded-lg border border-white/10 p-0.5 md:flex">
            <span className="px-1.5 text-[8px] uppercase tracking-wide text-white/30">Tube mode</span>
            {DISPLAY_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDisplayMode(mode.id as DisplayMode)}
                className={cn(
                  "rounded-md px-2 py-1 text-[9px] font-medium transition",
                  state.displayMode === mode.id
                    ? "bg-white/12 text-white"
                    : "text-white/45 hover:text-white/70"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <MiniSlider
            label="Tube width"
            value={active.tubeStyle ?? TUBE_STYLE_DEFAULT}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => patch({ tubeStyle: v })}
            className="hidden w-[96px] md:flex"
          />
          <MiniSlider
            label="Brightness"
            value={active.brightness ?? 80}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => patch({ brightness: v })}
            className="hidden w-[96px] lg:flex"
          />
          <MiniSlider
            label="Glow"
            value={active.glow ?? 35}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => patch({ glow: v })}
            className="hidden w-[96px] xl:flex"
          />
          <button
            type="button"
            onClick={() => onOpenPanel?.("fonts")}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white/60 hover:border-white/20 hover:text-white"
          >
            Fonts
          </button>
        </>
      )}
    </div>
  );
}
