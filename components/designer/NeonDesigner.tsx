"use client";

import { useEffect, useState } from "react";
import { useQuote } from "@/components/quote/QuoteProvider";
import { Button } from "@/components/ui/Button";
import { downloadBlob } from "@/lib/designer/exportPreview";
import { exportStageAs, editorToSnapshot, estimateEditorPrice } from "@/lib/designer/editor/snapshot";
import type { DesignerQuotePayload } from "@/lib/designer/types";
import { EditorToolbar } from "./editor/EditorToolbar";
import { LayersPanel } from "./editor/LayersPanel";
import { WallCanvas } from "./WallCanvas";
import { useDesigner } from "./DesignerContext";
import { Logo } from "@/components/Logo";

async function wallFileFromPreview(blob: Blob): Promise<File> {
  return new File([blob], `neon-design-${Date.now()}.png`, { type: "image/png" });
}

export function NeonDesigner() {
  const { state, stageRef, applyWallPreset } = useDesigner();
  const { openQuoteWithDesigner } = useQuote();
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (!state.wallPreviewUrl) {
      applyWallPreset("black-wall");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="flex min-h-dvh flex-col bg-[#050505]">
      <header className="z-50 flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3">
          <Logo href="/" variant="compact" />
          <span className="hidden text-xs text-white/30 sm:inline">Design Editor</span>
        </div>
        <div className="relative flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={exporting}
            onClick={() => setExportOpen((v) => !v)}
          >
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-xl border border-white/10 bg-[#111] py-1 shadow-xl">
              <button type="button" className="block w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5" onClick={() => handleExport("png")}>PNG</button>
              <button type="button" className="block w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5" onClick={() => handleExport("jpeg")}>JPG</button>
            </div>
          )}
          <Button size="sm" onClick={handleQuote} disabled={exporting}>
            Request Quote
          </Button>
        </div>
      </header>

      <EditorToolbar />

      <div className="flex flex-1 flex-col gap-2 p-2 sm:flex-row sm:gap-3 sm:p-3">
        <LayersPanel />
        <div className="min-h-[55dvh] flex-1">
          <WallCanvas />
        </div>
      </div>
    </div>
  );
}
