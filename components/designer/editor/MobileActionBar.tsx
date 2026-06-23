"use client";

import { useDesigner } from "../DesignerContext";
import { cn } from "@/lib/utils";

type Tab = "wall" | "font" | "layout" | "support";

type Props = {
  activeTab: Tab | null;
  onTab: (tab: Tab | null) => void;
  onQuote: () => void;
  exporting: boolean;
};

export function MobileActionBar({ activeTab, onTab, onQuote, exporting }: Props) {
  const { zoomIn, zoomOut } = useDesigner();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "wall", label: "Mur", icon: "▦" },
    { id: "font", label: "Police", icon: "Aa" },
    { id: "layout", label: "Texte", icon: "¶" },
    { id: "support", label: "Support", icon: "◫" },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#050505]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(activeTab === t.id ? null : t.id)}
            className={cn(
              "flex min-h-[48px] min-w-[56px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition active:scale-95",
              activeTab === t.id
                ? "bg-neon-pink/15 text-neon-pink"
                : "text-white/60"
            )}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={zoomOut}
          className="flex min-h-[48px] min-w-[44px] items-center justify-center rounded-xl text-white/60 active:scale-95"
          aria-label="Zoom arrière"
        >
          −
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="flex min-h-[48px] min-w-[44px] items-center justify-center rounded-xl text-white/60 active:scale-95"
          aria-label="Zoom avant"
        >
          +
        </button>
        <button
          type="button"
          onClick={onQuote}
          disabled={exporting}
          className="min-h-[48px] shrink-0 rounded-xl bg-neon-pink px-3 text-[11px] font-semibold text-black active:scale-95 disabled:opacity-50"
        >
          Devis
        </button>
      </div>
    </div>
  );
}

export type { Tab as MobileTab };
