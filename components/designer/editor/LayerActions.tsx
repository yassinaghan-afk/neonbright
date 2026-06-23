"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDesigner } from "../DesignerContext";

type Props = {
  compact?: boolean;
  className?: string;
};

const LOGO_INPUT_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export function LayerActions({ compact, className }: Props) {
  const {
    state,
    addTextLayer,
    addLogoFromFile,
    duplicateSelected,
    deleteSelected,
  } = useDesigner();
  const logoRef = useRef<HTMLInputElement>(null);

  const btn = compact
    ? "rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-medium text-white/60 hover:border-white/20 hover:text-white active:scale-[0.98]"
    : "rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-white/60 hover:border-white/20 hover:text-white active:scale-[0.98]";

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <button type="button" onClick={addTextLayer} className={btn}>
        + Text
      </button>
      <button type="button" onClick={() => logoRef.current?.click()} className={btn}>
        + Logo
      </button>
      <input
        ref={logoRef}
        type="file"
        accept={LOGO_INPUT_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addLogoFromFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={duplicateSelected}
        disabled={!state.selectedId}
        className={cn(btn, "disabled:opacity-30")}
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={deleteSelected}
        disabled={!state.selectedId}
        className={cn(btn, "border-red-500/30 text-red-400 hover:text-red-300 disabled:opacity-30")}
      >
        Delete
      </button>
    </div>
  );
}
