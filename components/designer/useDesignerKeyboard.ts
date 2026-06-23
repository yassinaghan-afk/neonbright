"use client";

import { useEffect } from "react";
import { useDesigner } from "./DesignerContext";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useDesignerKeyboard() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    duplicateSelected,
    state,
  } = useDesigner();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "z" && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        return;
      }

      if (mod && ((e.key === "z" && e.shiftKey) || e.key === "y" || e.key === "Y")) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
        return;
      }

      if (mod && (e.key === "d" || e.key === "D") && state.selectedId) {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    duplicateSelected,
    state.selectedId,
  ]);
}
