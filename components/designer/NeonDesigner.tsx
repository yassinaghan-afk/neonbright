"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuote } from "@/components/quote/QuoteProvider";
import { Button } from "@/components/ui/Button";
import { downloadBlob } from "@/lib/designer/exportPreview";
import { exportStageAs, editorToSnapshot, estimateEditorPrice } from "@/lib/designer/editor/snapshot";
import { formatPrice } from "@/lib/designer/pricing";
import type { DesignerQuotePayload } from "@/lib/designer/types";
import { EditorWorkspace } from "./editor/EditorWorkspace";
import { useDesigner } from "./DesignerContext";
import { useDesignerKeyboard } from "./useDesignerKeyboard";
import { isTransparentWall } from "@/lib/designer/wallPresets";
import { Logo } from "@/components/Logo";

async function wallFileFromPreview(blob: Blob): Promise<File> {
  return new File([blob], `neon-design-${Date.now()}.png`, { type: "image/png" });
}

export function NeonDesigner() {
  const { state, stageRef, applyWallPreset } = useDesigner();
  const { openQuoteWithDesigner } = useQuote();
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useDesignerKeyboard();
  const livePrice = useMemo(() => estimateEditorPrice(state), [state]);

  useEffect(() => {
    if (!state.wallPreviewUrl && state.wallPresetId && !isTransparentWall(state.wallPresetId)) {
      void applyWallPreset(state.wallPresetId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!exportOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [exportOpen]);

  const exportPreview = async (format: "png" | "jpeg") => {
    const stage = stageRef.current;
    if (!stage) throw new Error("Editor not ready");
    return exportStageAs(stage, format);
  };

  const handleExport = async (format: "png" | "jpeg") => {
    setExporting(true);
    setExportOpen(false);
    try {
      const blob = await exportPreview(format);
      downloadBlob(blob, `neonbright-design-${Date.now()}.${format === "jpeg" ? "jpg" : "png"}`);
    } finally {
      setExporting(false);
    }
  };

  const handleQuote = async () => {
    setExporting(true);
    try {
      const previewBlob = await exportPreview("png");
      const price = estimateEditorPrice(state);
      const wallImage = state.wallImage ?? (await wallFileFromPreview(previewBlob));
      const logoLayer = state.layers.find((l) => l.type === "logo");
      const payload: DesignerQuotePayload = {
        snapshot: editorToSnapshot(state, price),
        wallImage,
        logoFile: logoLayer?.file ?? null,
        previewBlob,
      };
      openQuoteWithDesigner(payload);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#050505]">
      <header className="z-50 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#080808] px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Logo href="/" variant="compact" />
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-neon-pink/25 bg-neon-pink/8 px-2.5 py-1 sm:px-3">
            <p className="text-[9px] uppercase tracking-wider text-white/40 sm:text-[10px]">Est. price</p>
            <p className="font-mono text-sm font-bold leading-tight text-neon-pink sm:text-base">
              {formatPrice(livePrice)}
            </p>
          </div>

          <div ref={exportRef} className="relative">
            <Button
              variant="secondary"
              size="sm"
              disabled={exporting}
              onClick={() => setExportOpen((v) => !v)}
            >
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">↓</span>
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[110px] rounded-xl border border-white/10 bg-[#111] py-1 shadow-xl">
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/5"
                  onClick={() => handleExport("png")}
                >
                  PNG
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/5"
                  onClick={() => handleExport("jpeg")}
                >
                  JPG
                </button>
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleQuote}
            disabled={exporting}
            className="shadow-[0_0_14px_rgba(255,45,149,0.35)]"
          >
            {exporting ? "…" : <span className="hidden sm:inline">Get a Quote</span>}
            {exporting ? null : <span className="sm:hidden">Quote</span>}
          </Button>
        </div>
      </header>

      <EditorWorkspace livePrice={livePrice} />
    </div>
  );
}
