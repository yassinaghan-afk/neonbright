"use client";

import { useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDesigner } from "../DesignerContext";
import { EDITOR_FONTS, FONT_CATEGORIES } from "@/lib/designer/fonts";
import { NEON_COLORS, GLOW_MAX, GLOW_MIN } from "@/lib/designer/constants";
import { WALL_PRESETS } from "@/lib/designer/wallPresets";
import { measureLayer } from "@/lib/designer/editor/measurements";
import type { NeonLayer } from "@/lib/designer/editor/types";

function IconBtn({
  label,
  onClick,
  disabled,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-lg border px-2.5 text-xs transition-all active:scale-95 disabled:opacity-30",
        active
          ? "border-neon-pink/50 bg-neon-pink/10 text-neon-pink"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function useActiveLayer(state: ReturnType<typeof useDesigner>["state"]) {
  return (
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0] ??
    null
  );
}

export function EditorToolbar() {
  const {
    state,
    updateLayer,
    addTextLayer,
    addLogoFromFile,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    applyWallPreset,
    setWallImage,
  } = useDesigner();

  const logoRef = useRef<HTMLInputElement>(null);
  const wallRef = useRef<HTMLInputElement>(null);
  const rgbRef = useRef<HTMLInputElement>(null);
  const [fontOpen, setFontOpen] = useState(true);
  const [wallOpen, setWallOpen] = useState(false);
  const [fontCat, setFontCat] = useState<string>("Modern");

  const active = useActiveLayer(state);

  const patchActive = (p: Partial<NeonLayer>) => {
    if (active) updateLayer(active.id, p);
  };

  const dims = active ? measureLayer(active) : null;

  const fontsInCat = useMemo(
    () => EDITOR_FONTS.filter((f) => f.category === fontCat),
    [fontCat]
  );

  const isText = active?.type === "text";

  return (
    <div className="sticky top-0 z-40 space-y-2 border-b border-white/10 bg-[#050505]/95 px-2 py-2 backdrop-blur-xl sm:px-3">
      {/* Row 1: actions + dimensions inspector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <IconBtn label="Undo" onClick={undo} disabled={!canUndo}>↶</IconBtn>
        <IconBtn label="Redo" onClick={redo} disabled={!canRedo}>↷</IconBtn>
        <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
        <IconBtn label="Add text" onClick={addTextLayer}>+ Text</IconBtn>
        <IconBtn label="Add logo" onClick={() => logoRef.current?.click()}>+ Logo</IconBtn>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addLogoFromFile(f); e.target.value = ""; }} />
        <IconBtn label="Duplicate" onClick={duplicateSelected} disabled={!active}>⧉</IconBtn>
        <IconBtn label="Delete" onClick={deleteSelected} disabled={!active}>✕</IconBtn>
        <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
        {dims && (
          <div className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <span className="text-[10px] text-white/45">
              W: <span className="font-mono text-neon-pink">{dims.widthCm}cm</span>
              {" · "}
              H: <span className="font-mono text-neon-pink">{dims.heightCm}cm</span>
            </span>
          </div>
        )}
        <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
        <IconBtn label="Zoom out" onClick={zoomOut}>−</IconBtn>
        <span className="shrink-0 text-[10px] text-white/40">{Math.round(state.canvasZoom * 100)}%</span>
        <IconBtn label="Zoom in" onClick={zoomIn}>+</IconBtn>
        <IconBtn label="Fit" onClick={fitToScreen}>Fit</IconBtn>
        <IconBtn label="Reset view" onClick={resetView}>Reset</IconBtn>
        <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
        <IconBtn label="Walls" onClick={() => setWallOpen((v) => !v)} active={wallOpen}>Wall</IconBtn>
        <IconBtn label="Upload wall" onClick={() => wallRef.current?.click()}>Upload</IconBtn>
        <input ref={wallRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { setWallImage(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </div>

      {wallOpen && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {WALL_PRESETS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => applyWallPreset(w.id)}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px]",
                state.wallPresetId === w.id
                  ? "border-neon-pink/50 bg-neon-pink/10 text-neon-pink"
                  : "border-white/10 text-white/55 hover:text-white"
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      {/* Row 2: always-visible global controls */}
      {active && (
        <div className="flex flex-wrap items-center gap-2">
          <IconBtn label="Fonts" onClick={() => setFontOpen((v) => !v)} active={fontOpen}>
            Font
          </IconBtn>

          <div className="flex gap-1 overflow-x-auto">
            {NEON_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => patchActive({ color: c.hex })}
                className={cn(
                  "h-7 w-7 shrink-0 rounded-full border-2",
                  active.color === c.hex ? "border-white" : "border-white/20"
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <button
              type="button"
              title="RGB"
              onClick={() => rgbRef.current?.click()}
              className="h-7 w-7 shrink-0 rounded-full border-2 border-white/20"
              style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}
            />
            <input ref={rgbRef} type="color" value={active.color} onChange={(e) => patchActive({ color: e.target.value })} className="sr-only" />
          </div>

          <div className="flex min-w-[100px] items-center gap-1.5">
            <span className="text-[10px] text-white/40">Glow</span>
            <input
              type="range"
              min={GLOW_MIN}
              max={GLOW_MAX}
              value={active.glow}
              onChange={(e) => patchActive({ glow: Number(e.target.value) })}
              className="h-1 w-20 accent-neon-pink"
            />
          </div>

          <div className="flex min-w-[120px] items-center gap-1.5">
            <span className="text-[10px] text-white/40">Spacing</span>
            <input
              type="range"
              min={-10}
              max={40}
              value={active.letterSpacing}
              onChange={(e) => patchActive({ letterSpacing: Number(e.target.value) })}
              className="h-1 w-20 accent-neon-pink"
              disabled={!isText}
            />
          </div>

          <div className="flex min-w-[100px] items-center gap-1.5">
            <span className="text-[10px] text-white/40">Rotate</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={active.rotation}
              onChange={(e) => patchActive({ rotation: Number(e.target.value) })}
              className="h-1 w-20 accent-neon-pink"
            />
          </div>

          <div className="flex min-w-[90px] items-center gap-1.5">
            <span className="text-[10px] text-white/40">Opacity</span>
            <input
              type="range"
              min={20}
              max={100}
              value={Math.round(active.opacity * 100)}
              onChange={(e) => patchActive({ opacity: Number(e.target.value) / 100 })}
              className="h-1 w-16 accent-neon-pink"
            />
          </div>

          {isText && (
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <IconBtn key={a} label={`Align ${a}`} onClick={() => patchActive({ align: a })} active={active.align === a}>
                  {a[0].toUpperCase()}
                </IconBtn>
              ))}
            </div>
          )}
        </div>
      )}

      {fontOpen && isText && active && (
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-2">
          <div className="mb-2 flex gap-1 overflow-x-auto">
            {FONT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFontCat(cat)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px]",
                  fontCat === cat ? "bg-neon-pink/20 text-neon-pink" : "text-white/45 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid max-h-36 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
            {fontsInCat.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => patchActive({ fontId: f.id })}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left",
                  active.fontId === f.id
                    ? "border-neon-pink/50 bg-neon-pink/10"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <span className="block text-lg text-white" style={{ fontFamily: f.family }}>
                  {f.preview}
                </span>
                <span className="block truncate text-[9px] text-white/45">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
