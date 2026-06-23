"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { normalizeArabicText, needsRtlShaping } from "@/lib/designer/editor/arabicText";
import { useDesigner } from "../DesignerContext";
import {
  EDITOR_FONTS,
  FONT_SECTIONS,
  categoriesInSection,
  displayModeForSection,
  resolveFontFamily,
  resolveFontWeight,
} from "@/lib/designer/fonts";
import { normalizeFontSizeOnSwitch } from "@/lib/designer/fontScale";
import { ensureFontLoaded } from "@/lib/designer/editor/textMetrics";
import { NEON_COLORS } from "@/lib/designer/constants";
import { measureTextLayer, pxToCm } from "@/lib/designer/editor/measurements";
import { isPlexiglassBackboard, clampPlexiglassSize } from "@/lib/designer/plexiglass";
import { DISPLAY_MODES, TUBE_STYLE_DEFAULT } from "@/lib/designer/neonTubeStyles";
import type { NeonLayer } from "@/lib/designer/editor/types";
import { WallScenePicker } from "./WallScenePicker";
import { BackboardPicker } from "./BackboardPicker";
import { NeonFontCard } from "./NeonFontCard";
import { DesignerHistoryControls } from "../DesignerHistoryControls";
import { LayersPanel } from "./LayersPanel";
import { TextLayoutControls } from "./TextLayoutControls";

export type PanelId = "layers" | "text" | "fonts" | "colors" | "wall" | "support" | "size";

const PANELS: { id: PanelId; label: string; icon: string }[] = [
  { id: "layers",  label: "Layers",  icon: "☰" },
  { id: "text",    label: "Text",    icon: "T" },
  { id: "fonts",   label: "Fonts",   icon: "Aa" },
  { id: "colors",  label: "Colors",  icon: "◉" },
  { id: "wall",    label: "Wall",    icon: "▦" },
  { id: "support", label: "Support", icon: "⬡" },
  { id: "size",    label: "Size",    icon: "↔" },
];

const SIZE_PRESETS = [
  { label: "XS", fontSize: 40 },
  { label: "S",  fontSize: 56 },
  { label: "M",  fontSize: 72 },
  { label: "L",  fontSize: 96 },
  { label: "XL", fontSize: 128 },
];

function useActiveLayer() {
  const { state } = useDesigner();
  return (
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0] ??
    null
  );
}

function PanelText({ active, patch }: { active: NeonLayer | null; patch: (p: Partial<NeonLayer>) => void }) {
  const isRtl = active ? needsRtlShaping(active) : false;
  const hasExplicitLines = (active?.text ?? "").includes("\n");

  return (
    <div className="space-y-3">
      {!active ? (
        <p className="text-center text-xs text-white/35">Select a text layer to edit.</p>
      ) : hasExplicitLines ? (
        <textarea
          rows={3}
          value={active.text}
          dir={isRtl ? "rtl" : "ltr"}
          onChange={(e) => {
            let v = e.target.value;
            if (isRtl) v = normalizeArabicText(v);
            patch({
              text: v,
              textLayout: v.includes("\n") ? "multiline" : "single",
              name: v.replace(/\n/g, " ").slice(0, 20) || "Text",
            });
          }}
          placeholder="NEON BRIGHT"
          className={cn(
            "w-full resize-none rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2.5",
            "text-base text-white placeholder-white/25 outline-none focus:border-neon-pink/50",
            isRtl && "text-right"
          )}
        />
      ) : (
        <input
          type="text"
          value={active.text}
          dir={isRtl ? "rtl" : "ltr"}
          onChange={(e) => {
            let v = e.target.value.replace(/\n/g, " ");
            if (isRtl) v = normalizeArabicText(v);
            patch({ text: v, textLayout: "single", name: v.slice(0, 20) || "Text" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = `${active.text}\n`;
              patch({ text: v, textLayout: "multiline", name: active.text.slice(0, 20) || "Text" });
            }
          }}
          placeholder="NEON BRIGHT"
          className={cn(
            "w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2.5",
            "text-lg text-white placeholder-white/25 outline-none focus:border-neon-pink/50",
            isRtl && "text-right"
          )}
        />
      )}

      {active?.type === "text" && (
        <TextLayoutControls layer={active} onChange={patch} />
      )}

      <p className="text-[10px] leading-relaxed text-white/30">
        Tap the sign to select · Drag to move · Double-tap to edit text
      </p>
    </div>
  );
}

function PanelFonts({ active, patch }: { active: NeonLayer | null; patch: (p: Partial<NeonLayer>) => void }) {
  const { setDisplayMode } = useDesigner();
  const preview = active?.text?.trim();

  if (!active) {
    return <p className="text-center text-xs text-white/35">Select a text layer to change its font.</p>;
  }

  return (
    <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-0.5">
      {FONT_SECTIONS.map((section) => {
        const fonts = EDITOR_FONTS.filter((f) => f.section === section.id);
        if (!fonts.length) return null;
        const categories = categoriesInSection(section.id);
        return (
          <div key={section.id} className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                {section.label}
              </p>
              <p className="text-[9px] text-white/30">{section.description}</p>
            </div>
            {categories.map((category) => {
              const categoryFonts = fonts.filter((f) => f.category === category);
              if (!categoryFonts.length) return null;
              return (
                <div key={category} className="space-y-1.5">
                  <p className="text-[10px] font-medium text-white/40">{category}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryFonts.map((f) => (
                      <NeonFontCard
                        key={f.id}
                        font={f}
                        active={active?.fontId === f.id}
                        color={active?.color ?? "#ff2d95"}
                        previewText={preview}
                        onSelect={() => {
                          if (!active || active.fontId === f.id) return;
                          void (async () => {
                            const family = resolveFontFamily(f.id);
                            const weight = resolveFontWeight(f.id);
                            await ensureFontLoaded(family, weight, active.fontSize);
                            const fontSize = normalizeFontSizeOnSwitch(
                              active.text,
                              active.fontId,
                              active.fontSize,
                              f.id
                            );
                      patch({
                        fontId: f.id,
                        fontSize,
                        ...(f.rtl ? { letterSpacing: 0 } : {}),
                      });
                      setDisplayMode(displayModeForSection(f.section));
                          })();
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PanelColors({ active, patch }: { active: NeonLayer | null; patch: (p: Partial<NeonLayer>) => void }) {
  const { state, setDisplayMode } = useDesigner();
  const rgbRef = useRef<HTMLInputElement>(null);

  if (!active) {
    return <p className="text-center text-xs text-white/35">Select a text layer to edit color and glow.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {NEON_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => patch({ color: c.hex })}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-2 transition active:scale-[0.97]",
              active?.color === c.hex ? "border-white/50 ring-1 ring-white/20" : "border-white/10"
            )}
          >
            <div
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-[9px] text-white/50">{c.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => rgbRef.current?.click()}
          className="flex flex-col items-center gap-1 rounded-xl border border-white/10 p-2"
        >
          <div
            className="h-8 w-8 rounded-full"
            style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
          />
          <span className="text-[9px] text-white/50">Custom</span>
        </button>
        <input ref={rgbRef} type="color" value={active?.color ?? "#ff2d95"}
          onChange={(e) => patch({ color: e.target.value })} className="sr-only" />
      </div>
      <div className="space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <div>
          <p className="mb-2 text-xs text-white/60">Tube mode</p>
          <div className="grid grid-cols-2 gap-1.5">
            {DISPLAY_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDisplayMode(mode.id)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-[10px] font-medium transition",
                  state.displayMode === mode.id
                    ? "border-neon-pink/50 bg-neon-pink/10 text-neon-pink"
                    : "border-white/10 text-white/50 hover:border-white/20"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-white/60">Tube width</span>
            <span className="font-mono text-neon-pink">{active?.tubeStyle ?? TUBE_STYLE_DEFAULT}%</span>
          </div>
          <input
            type="range" min={0} max={100}
            value={active?.tubeStyle ?? TUBE_STYLE_DEFAULT}
            onChange={(e) => patch({ tubeStyle: Number(e.target.value) })}
            className="h-1.5 w-full accent-neon-pink"
          />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-white/60">Brightness</span>
            <span className="font-mono text-neon-pink">{active?.brightness ?? 80}%</span>
          </div>
          <input
            type="range" min={0} max={100}
            value={active?.brightness ?? 80}
            onChange={(e) => patch({ brightness: Number(e.target.value) })}
            className="h-1.5 w-full accent-neon-pink"
          />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-white/60">Glow</span>
            <span className="font-mono text-neon-pink">{active?.glow ?? 35}%</span>
          </div>
          <input
            type="range" min={0} max={100}
            value={active?.glow ?? 35}
            onChange={(e) => patch({ glow: Number(e.target.value) })}
            className="h-1.5 w-full accent-neon-pink"
          />
        </div>
      </div>
    </div>
  );
}

function PanelSize({ active, patch }: { active: NeonLayer | null; patch: (p: Partial<NeonLayer>) => void }) {
  const dims = active && active.type === "text" ? measureTextLayer(active) : null;

  if (!active) {
    return <p className="text-center text-xs text-white/35">Select a layer to see size.</p>;
  }

  if (active.type === "logo") {
    return (
      <div className="space-y-3">
        <p className="text-center text-xs text-white/50">
          Resize the logo with the corner handles on the canvas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {SIZE_PRESETS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => patch({ fontSize: s.fontSize })}
            className={cn(
              "rounded-lg border py-2 text-center text-xs font-bold transition",
              active?.fontSize === s.fontSize
                ? "border-neon-pink/60 bg-neon-pink/15 text-neon-pink"
                : "border-white/10 text-white/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-white/60">Font size</span>
          <span className="font-mono text-neon-pink">{active?.fontSize ?? 72}px</span>
        </div>
        <input
          type="range" min={28} max={160} step={2}
          value={active?.fontSize ?? 72}
          onChange={(e) => patch({ fontSize: Number(e.target.value) })}
          className="h-1.5 w-full accent-neon-pink"
        />
      </div>
      {dims && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-neon-pink/20 bg-neon-pink/5 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wide text-white/35">Width</p>
            <p className="text-xl font-bold text-neon-pink">{dims.widthCm} cm</p>
          </div>
          <div className="rounded-xl border border-neon-pink/20 bg-neon-pink/5 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wide text-white/35">Height</p>
            <p className="text-xl font-bold text-neon-pink">{dims.heightCm} cm</p>
          </div>
        </div>
      )}
      <p className="text-[10px] text-white/30">Use corner handles on canvas to scale freely.</p>
    </div>
  );
}

function PanelPlexiglass() {
  const { state, updatePlexiglass, resetPlexiglassToSign, selectFocus } = useDesigner();
  const panel = state.plexiglass;
  if (!panel || !isPlexiglassBackboard(state.backboardType)) return null;

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white/70">Plexiglass panel</p>
        <button
          type="button"
          onClick={() => {
            resetPlexiglassToSign();
            selectFocus("plexiglass");
          }}
          className="text-[10px] text-neon-pink hover:underline"
        >
          Fit to sign
        </button>
      </div>
      <p className="text-[10px] text-white/35">
        Click the panel on canvas, then drag corner or side handles to resize. Text stays centered inside.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-white/50">
          Width
          <input
            type="number"
            min={10}
            value={pxToCm(panel.width)}
            onChange={(e) => {
              const layer = state.layers.find((l) => l.type === "text");
              const w = Math.max(40, Number(e.target.value) * 2.2);
              const clamped = layer ? clampPlexiglassSize(layer, w, panel.height) : { width: w, height: panel.height };
              updatePlexiglass({ width: clamped.width, offsetX: 0, offsetY: 0, manual: true });
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
          />
        </label>
        <label className="text-[10px] text-white/50">
          Height
          <input
            type="number"
            min={10}
            value={pxToCm(panel.height)}
            onChange={(e) => {
              const layer = state.layers.find((l) => l.type === "text");
              const h = Math.max(30, Number(e.target.value) * 2.2);
              const clamped = layer ? clampPlexiglassSize(layer, panel.width, h) : { width: panel.width, height: h };
              updatePlexiglass({ height: clamped.height, offsetX: 0, offsetY: 0, manual: true });
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
          />
        </label>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-white/50">
          <span>Corner radius</span>
          <span className="font-mono">{panel.cornerRadius}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          value={panel.cornerRadius}
          onChange={(e) => updatePlexiglass({ cornerRadius: Number(e.target.value), manual: true })}
          className="h-1.5 w-full accent-neon-pink"
        />
      </div>
    </div>
  );
}

type Props = {
  className?: string;
  variant?: "sidebar" | "mobile";
  openPanel?: PanelId | null;
  onOpenPanelConsumed?: () => void;
};

export function EditorPanels({ className, variant = "sidebar", openPanel, onOpenPanelConsumed }: Props) {
  const { state, updateLayer, applyWallPreset, setWallImage, setBackboardType, zoomIn, zoomOut } = useDesigner();
  const [open, setOpen] = useState<PanelId | null>("layers");
  const wallRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openPanel) {
      setOpen(openPanel);
      onOpenPanelConsumed?.();
    }
  }, [openPanel, onOpenPanelConsumed]);

  const active = useActiveLayer();
  const patch = useCallback(
    (p: Partial<NeonLayer>) => {
      if (active) updateLayer(active.id, p);
    },
    [active, updateLayer]
  );

  const customWall = Boolean(state.wallImage && !state.wallPresetId);

  const toggle = (id: PanelId) => setOpen((cur) => (cur === id ? null : id));

  const panelTitle = PANELS.find((p) => p.id === open)?.label ?? "";

  const isMobile = variant === "mobile";

  return (
    <div className={cn(isMobile ? "flex flex-col" : "flex shrink-0", className)}>
      {open && isMobile && (
        <>
          <button
            type="button"
            aria-label="Close panel"
            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpen(null)}
          />
          <div className="fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom))] z-40 max-h-[52dvh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0c0c0c] p-4 shadow-[0_-12px_40px_rgba(0,0,0,0.55)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{panelTitle}</span>
              <button type="button" onClick={() => setOpen(null)} className="rounded-lg px-2 py-1 text-white/40 hover:bg-white/5">
                ✕
              </button>
            </div>
            {open === "layers" && <LayersPanel embedded />}
            {open === "text" && <PanelText active={active} patch={patch} />}
            {open === "fonts" && <PanelFonts active={active} patch={patch} />}
            {open === "colors" && <PanelColors active={active} patch={patch} />}
            {open === "wall" && (
              <>
                <input ref={wallRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => { setWallImage(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                <WallScenePicker selectedId={state.wallPresetId} customActive={customWall}
                  onSelect={(id) => applyWallPreset(id)} onUpload={() => wallRef.current?.click()} />
              </>
            )}
            {open === "support" && (
              <>
                <BackboardPicker value={state.backboardType} onChange={setBackboardType} />
                <PanelPlexiglass />
              </>
            )}
            {open === "size" && <PanelSize active={active} patch={patch} />}
          </div>
        </>
      )}

      {/* Icon rail */}
      <div
        className={cn(
          isMobile
            ? "fixed inset-x-0 bottom-0 z-50 flex items-center justify-around gap-0.5 border-t border-white/10 bg-[#080808]/95 px-1 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-md"
            : "flex w-14 flex-col items-center gap-1 border-r border-white/8 bg-[#080808] py-2 md:w-16"
        )}
      >
        {isMobile && (
          <div className="flex shrink-0 items-center px-0.5">
            <DesignerHistoryControls compact />
          </div>
        )}
        {PANELS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            onClick={() => toggle(p.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl font-medium transition active:scale-95",
              isMobile ? "h-12 min-w-[48px] flex-1 text-[9px]" : "h-12 w-12 md:h-11 md:w-11 text-[10px]",
              open === p.id
                ? "bg-neon-pink/15 text-neon-pink ring-1 ring-neon-pink/30"
                : "text-white/45 hover:bg-white/5 hover:text-white/80"
            )}
          >
            <span className="text-sm leading-none">{p.icon}</span>
            <span className={cn("mt-0.5", isMobile ? "text-[8px]" : "hidden text-[8px] sm:block")}>{p.label}</span>
          </button>
        ))}
        {isMobile && (
          <>
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-11 min-w-[36px] flex-col items-center justify-center rounded-xl text-white/45 active:scale-95"
              aria-label="Zoom out"
            >
              <span className="text-sm">−</span>
            </button>
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-11 min-w-[36px] flex-col items-center justify-center rounded-xl text-white/45 active:scale-95"
              aria-label="Zoom in"
            >
              <span className="text-sm">+</span>
            </button>
          </>
        )}
      </div>

      {/* Desktop floating panel */}
      {open && !isMobile && (
        <div
          className={cn(
            "flex w-[min(100vw-3.5rem,320px)] flex-col border-r border-white/8 bg-[#0a0a0a]/98 backdrop-blur-xl",
            "max-h-[min(70dvh,calc(100dvh-8rem))] md:max-h-none"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
            <span className="text-sm font-semibold text-white">{panelTitle}</span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-lg px-2 py-1 text-white/40 hover:bg-white/5 hover:text-white"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {open === "layers" && <LayersPanel embedded />}
            {open === "text" && <PanelText active={active} patch={patch} />}
            {open === "fonts" && <PanelFonts active={active} patch={patch} />}
            {open === "colors" && <PanelColors active={active} patch={patch} />}
            {open === "wall" && (
              <>
                <input
                  ref={wallRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    setWallImage(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <WallScenePicker
                  selectedId={state.wallPresetId}
                  customActive={customWall}
                  onSelect={(id) => applyWallPreset(id)}
                  onUpload={() => wallRef.current?.click()}
                />
              </>
            )}
            {open === "support" && (
              <>
                <BackboardPicker value={state.backboardType} onChange={setBackboardType} />
                <PanelPlexiglass />
              </>
            )}
            {open === "size" && <PanelSize active={active} patch={patch} />}
          </div>
        </div>
      )}
    </div>
  );
}