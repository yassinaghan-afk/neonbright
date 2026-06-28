"use client";

import { useMemo, useRef, useState } from "react";
import { useQuote } from "@/components/quote/QuoteProvider";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { estimateSignagePrice, formatSignagePrice } from "@/lib/signage/pricing";
import { toSignageSnapshot } from "@/lib/signage/types";
import { SIGN_TYPE_OPTIONS } from "@/lib/signage/signTypes";
import { SignageFacadeScene } from "./SignageFacadeScene";
import { SignageControlPanel } from "./SignageControlPanel";
import { useSignage } from "./SignageContext";

async function capturePreview(container: HTMLElement): Promise<Blob> {
  const html2canvas = (await import("@/lib/signage/capturePreview")).captureSignagePreview;
  return html2canvas(container);
}

export function SignageDesigner() {
  const { state } = useSignage();
  const { openQuote } = useQuote();
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const livePrice = useMemo(() => estimateSignagePrice(state), [state]);
  const signLabel =
    SIGN_TYPE_OPTIONS.find((s) => s.id === state.signType)?.label ?? state.signType;

  const handleQuote = () => {
    const snapshot = toSignageSnapshot(state, livePrice);
    const summary = [
      "Configurateur Enseigne Commerciale",
      `Type: ${signLabel}`,
      `Nom: ${state.businessName}`,
      `Dimensions: ${state.signWidthCm} × ${state.signHeightCm} cm`,
      `Façade: ${state.facadeType}`,
      `Mode: ${state.timeOfDay === "night" ? "Nuit" : "Jour"}`,
      `Estimation: ${formatSignagePrice(livePrice)}`,
      state.logoFile ? `Logo: ${state.logoFile.name}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    if (typeof window !== "undefined") {
      sessionStorage.setItem("signage-quote-summary", summary);
      sessionStorage.setItem("signage-quote-json", JSON.stringify(snapshot));
    }
    openQuote(1);
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const blob = await capturePreview(previewRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enseigne-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#050505]">
      <header className="z-50 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#080808] px-3 py-2 sm:px-4">
        <div className="flex items-center gap-3">
          <Logo href="/" variant="compact" />
          <div className="hidden border-l border-white/10 pl-3 sm:block">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-neon-purple">
              Configurateur Enseigne
            </p>
            <p className="text-[10px] text-white/40">Signalétique commerciale 3D</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-neon-purple/25 bg-neon-purple/8 px-2.5 py-1 sm:px-3">
            <p className="text-[9px] uppercase tracking-wider text-white/40 sm:text-[10px]">
              Estimation
            </p>
            <p className="font-mono text-sm font-bold leading-tight text-neon-purple sm:text-base">
              {formatSignagePrice(livePrice)}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            disabled={exporting}
            onClick={handleExport}
          >
            <span className="hidden sm:inline">Exporter</span>
            <span className="sm:hidden">↓</span>
          </Button>

          <Button
            size="sm"
            onClick={handleQuote}
            disabled={exporting}
            className="shadow-[0_0_14px_rgba(168,85,247,0.35)]"
          >
            <span className="hidden sm:inline">Demander un devis</span>
            <span className="sm:hidden">Devis</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div ref={previewRef} className="min-h-0 flex-1 p-3 sm:p-4 lg:p-5">
          <SignageFacadeScene />
        </div>
        <div className="h-[42vh] shrink-0 lg:h-auto lg:w-[340px] xl:w-[380px]">
          <SignageControlPanel />
        </div>
      </div>
    </div>
  );
}
