"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDesigner } from "../DesignerContext";
import { measureTextLayer } from "@/lib/designer/editor/measurements";
import { formatPrice } from "@/lib/designer/pricing";
import { EditorPanels, type PanelId } from "./EditorPanels";
import { DesignerToolbar } from "../DesignerToolbar";
import { CanvasRulers, RULER_SIZE } from "./CanvasRulers";
import { useContainerSize } from "../studio/hooks";

const EditorCanvas = dynamic(() => import("../studio/EditorCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#080808]">
      <p className="text-sm text-white/40">Loading canvas…</p>
    </div>
  ),
});

type Props = {
  livePrice: number;
};

export function EditorWorkspace({ livePrice }: Props) {
  const { state, restoredFromSave, boundaryWarning, clearBoundaryWarning } = useDesigner();
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const { width: totalW, height: totalH } = useContainerSize(canvasWrapRef);
  const [showRestored, setShowRestored] = useState(false);
  const [panelRequest, setPanelRequest] = useState<PanelId | null>(null);
  const clearPanelRequest = useCallback(() => setPanelRequest(null), []);

  const canvasW = Math.max(0, totalW - RULER_SIZE);
  const canvasH = Math.max(0, totalH - RULER_SIZE);

  const active =
    state.layers.find((l) => l.id === state.selectedId) ??
    state.layers.find((l) => l.type === "text") ??
    state.layers[0] ??
    null;

  const dims = active ? measureTextLayer(active) : null;

  useEffect(() => {
    if (restoredFromSave) {
      setShowRestored(true);
      const id = window.setTimeout(() => setShowRestored(false), 4000);
      return () => window.clearTimeout(id);
    }
  }, [restoredFromSave]);

  useEffect(() => {
    if (!boundaryWarning) return;
    const id = window.setTimeout(() => clearBoundaryWarning(), 3000);
    return () => window.clearTimeout(id);
  }, [boundaryWarning, clearBoundaryWarning]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
      <EditorPanels
        variant="sidebar"
        className="hidden sm:flex"
        openPanel={panelRequest}
        onOpenPanelConsumed={clearPanelRequest}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#060606]">
        <div className="hidden sm:block">
          <DesignerToolbar onOpenPanel={setPanelRequest} />
        </div>
        <div className="sm:hidden">
          <DesignerToolbar mobile onOpenPanel={setPanelRequest} />
        </div>

        {(showRestored || boundaryWarning) && (
          <div className="shrink-0 border-b border-white/8 bg-[#0a0a0a] px-3 py-1.5 text-center text-xs">
            {showRestored && (
              <span className="text-emerald-400/90">Design restored from your last session</span>
            )}
            {showRestored && boundaryWarning && <span className="mx-2 text-white/20">|</span>}
            {boundaryWarning && (
              <span className="text-amber-400/90">{boundaryWarning}</span>
            )}
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/8 bg-[#0a0a0a] px-3 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            {dims ? (
              <>
                <span className="text-white/45">
                  <span className="font-mono font-semibold text-white">{dims.widthCm}</span>
                  <span className="ml-1">cm wide</span>
                </span>
                <span className="text-white/20">×</span>
                <span className="text-white/45">
                  <span className="font-mono font-semibold text-white">{dims.heightCm}</span>
                  <span className="ml-1">cm tall</span>
                </span>
              </>
            ) : (
              <span className="text-white/35">Add text to see size</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/35 sm:text-xs">
            <span className="sm:hidden font-mono text-white/50">{formatPrice(livePrice)}</span>
            <span className="hidden sm:inline">Drag · Resize · Double-click to edit</span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 p-1.5 pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:p-3 sm:pb-3">
          <div
            ref={canvasWrapRef}
            className="relative h-full min-h-[50dvh] overflow-hidden rounded-lg border border-white/10 bg-[#0c0c0c] shadow-[0_8px_32px_rgba(0,0,0,0.45)] sm:min-h-0 sm:rounded-xl"
          >
            {canvasW > 0 && canvasH > 0 && (
              <CanvasRulers width={canvasW} height={canvasH} zoom={state.canvasZoom} />
            )}
            <div
              className="absolute"
              style={{ left: RULER_SIZE, top: RULER_SIZE, width: canvasW, height: canvasH }}
            >
              <EditorCanvas />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 shrink-0 sm:hidden">
        <EditorPanels
          variant="mobile"
          openPanel={panelRequest}
          onOpenPanelConsumed={clearPanelRequest}
        />
      </div>
    </div>
  );
}
