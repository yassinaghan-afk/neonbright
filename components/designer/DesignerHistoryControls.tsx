"use client";

import { cn } from "@/lib/utils";
import { useDesigner } from "./DesignerContext";

type Props = {
  className?: string;
  compact?: boolean;
};

export function DesignerHistoryControls({ className, compact }: Props) {
  const { canUndo, canRedo, undo, redo } = useDesigner();

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={undo}
        className={cn(
          "rounded-lg font-medium transition active:scale-95 disabled:opacity-30",
          compact ? "h-9 min-w-[40px] px-2 text-sm" : "h-8 px-2.5 text-sm",
          canUndo ? "text-white/70 hover:bg-white/8 hover:text-white" : "text-white/25"
        )}
        aria-label="Undo"
      >
        ↶{!compact && <span className="ml-1 hidden text-xs lg:inline">Undo</span>}
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        onClick={redo}
        className={cn(
          "rounded-lg font-medium transition active:scale-95 disabled:opacity-30",
          compact ? "h-9 min-w-[40px] px-2 text-sm" : "h-8 px-2.5 text-sm",
          canRedo ? "text-white/70 hover:bg-white/8 hover:text-white" : "text-white/25"
        )}
        aria-label="Redo"
      >
        ↷{!compact && <span className="ml-1 hidden text-xs lg:inline">Redo</span>}
      </button>
    </div>
  );
}
