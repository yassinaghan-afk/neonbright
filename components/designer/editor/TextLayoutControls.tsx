"use client";

import { cn } from "@/lib/utils";
import { applyTextLayout } from "@/lib/designer/editor/textLayout";
import type { NeonLayer, TextLayoutMode } from "@/lib/designer/editor/types";

const LAYOUTS: {
  id: TextLayoutMode;
  label: string;
  example: string;
}[] = [
  { id: "single", label: "Une ligne", example: "YASSIN" },
  { id: "multiline", label: "Multi-lignes", example: "YASSIN\nAGADIR" },
  { id: "auto-wrap", label: "Retour auto", example: "YASSIN\nAGADIR" },
  { id: "manual", label: "Sauts manuels", example: "YASSIN\nAGADIR" },
];

type Props = {
  layer: NeonLayer;
  onChange: (patch: Partial<NeonLayer>) => void;
};

export function TextLayoutControls({ layer, onChange }: Props) {
  const setLayout = (mode: TextLayoutMode) => {
    const text = applyTextLayout(layer.text, mode);
    onChange({ textLayout: mode, text });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">Disposition du texte</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLayout(l.id)}
            className={cn(
              "rounded-xl border p-2.5 text-left transition-all min-h-[72px] active:scale-[0.98]",
              layer.textLayout === l.id
                ? "border-neon-pink/60 bg-neon-pink/10"
                : "border-white/10 hover:border-white/20"
            )}
          >
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-tight text-neon-pink">
              {l.example}
            </pre>
            <p className="mt-1 text-[10px] text-white/50">{l.label}</p>
          </button>
        ))}
      </div>

      {(layer.textLayout === "auto-wrap" || layer.textLayout === "manual") && (
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] text-white/45">Largeur wrap</span>
          <input
            type="range"
            min={120}
            max={600}
            value={layer.wrapWidth}
            onChange={(e) => onChange({ wrapWidth: Number(e.target.value) })}
            className="h-1.5 flex-1 accent-neon-pink"
          />
          <span className="shrink-0 font-mono text-[10px] text-white/50">{layer.wrapWidth}px</span>
        </div>
      )}

      {layer.textLayout === "manual" && (
        <p className="text-[10px] text-white/40">
          Double-cliquez sur le texte pour éditer. Utilisez Entrée pour un saut de ligne.
        </p>
      )}
    </div>
  );
}
