"use client";

import { useEffect } from "react";
import { useDesigner } from "./DesignerContext";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useDesignerKeyboard() {
  const { undo, redo, canUndo, canRedo } = useDesigner();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === "z" && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        return;
      }

      if ((e.key === "z" && e.shiftKey) || e.key === "Z") {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
