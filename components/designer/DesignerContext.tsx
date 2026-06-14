"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type Konva from "konva";
import { ZOOM_MAX, ZOOM_MIN } from "@/lib/designer/constants";
import {
  createLogoLayer,
  createTextLayer,
  INITIAL_EDITOR_STATE,
  type EditorState,
  type NeonLayer,
} from "@/lib/designer/editor/types";
import { createWallPresetFile } from "@/lib/designer/wallPresets";

const HISTORY_LIMIT = 40;

type DesignerContextValue = {
  state: EditorState;
  stageRef: RefObject<Konva.Stage | null>;
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  selectLayer: (id: string | null) => void;
  updateLayer: (id: string, patch: Partial<NeonLayer>, recordHistory?: boolean) => void;
  addTextLayer: () => void;
  addLogoFromFile: (file: File) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setWallImage: (file: File | null) => void;
  applyWallPreset: (presetId: string) => Promise<void>;
  setCanvasZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToScreen: () => void;
};

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function useDesigner() {
  const ctx = useContext(DesignerContext);
  if (!ctx) throw new Error("useDesigner must be used within DesignerProvider");
  return ctx;
}

function cloneState(s: EditorState): EditorState {
  return {
    ...s,
    layers: s.layers.map((l) => ({ ...l })),
  };
}

export function DesignerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(INITIAL_EDITOR_STATE);
  const [history, setHistory] = useState<EditorState[]>([cloneState(INITIAL_EDITOR_STATE)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  const stageRef = useRef<Konva.Stage | null>(null);
  const skipHistory = useRef(false);

  const mutate = useCallback(
    (fn: (prev: EditorState) => EditorState, recordHistory = true) => {
      setState((prev) => {
        const next = fn(prev);
        if (recordHistory) {
          setHistory((h) => {
            const trimmed = h.slice(0, historyIndex + 1);
            const updated = [...trimmed, cloneState(next)].slice(-HISTORY_LIMIT);
            setHistoryIndex(updated.length - 1);
            return updated;
          });
        }
        return next;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    skipHistory.current = true;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setState(cloneState(history[nextIndex]));
    skipHistory.current = false;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    skipHistory.current = true;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setState(cloneState(history[nextIndex]));
    skipHistory.current = false;
  }, [history, historyIndex]);

  const selectLayer = useCallback(
    (id: string | null) => mutate((p) => ({ ...p, selectedId: id }), false),
    [mutate]
  );

  const updateLayer = useCallback(
    (id: string, patch: Partial<NeonLayer>, recordHistory = true) => {
      mutate(
        (p) => ({
          ...p,
          layers: p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }),
        recordHistory
      );
    },
    [mutate]
  );

  const sortedLayers = (layers: NeonLayer[]) =>
    [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const addTextLayer = useCallback(() => {
    mutate((p) => {
      const maxZ = Math.max(0, ...p.layers.map((l) => l.zIndex));
      const layer = createTextLayer({ zIndex: maxZ + 1, y: p.layers.length * 20 });
      return { ...p, layers: [...p.layers, layer], selectedId: layer.id };
    });
  }, [mutate]);

  const addLogoFromFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      mutate((p) => {
        const maxZ = Math.max(0, ...p.layers.map((l) => l.zIndex));
        const layer = createLogoLayer(url, file.name, file, { zIndex: maxZ + 1 });
        return { ...p, layers: [...p.layers, layer], selectedId: layer.id };
      });
    },
    [mutate]
  );

  const deleteSelected = useCallback(() => {
    mutate((p) => {
      if (!p.selectedId) return p;
      const layer = p.layers.find((l) => l.id === p.selectedId);
      if (layer?.imageUrl) URL.revokeObjectURL(layer.imageUrl);
      const layers = p.layers.filter((l) => l.id !== p.selectedId);
      if (!layers.length) {
        const fallback = createTextLayer();
        return { ...p, layers: [fallback], selectedId: fallback.id };
      }
      const next =
        layers.find((l) => l.type === "text") ?? layers[0];
      return { ...p, layers, selectedId: next.id };
    });
  }, [mutate]);

  const duplicateSelected = useCallback(() => {
    mutate((p) => {
      const src = p.layers.find((l) => l.id === p.selectedId);
      if (!src) return p;
      const maxZ = Math.max(...p.layers.map((l) => l.zIndex));
      const copy: NeonLayer = {
        ...src,
        id: `${src.type}-${Date.now()}`,
        name: `${src.name} copy`,
        x: src.x + 24,
        y: src.y + 24,
        zIndex: maxZ + 1,
        imageUrl: src.imageUrl,
      };
      return { ...p, layers: [...p.layers, copy], selectedId: copy.id };
    });
  }, [mutate]);

  const bringForward = useCallback(() => {
    mutate((p) => {
      if (!p.selectedId) return p;
      const ordered = sortedLayers(p.layers);
      const idx = ordered.findIndex((l) => l.id === p.selectedId);
      if (idx < 0 || idx >= ordered.length - 1) return p;
      const next = ordered[idx + 1];
      return {
        ...p,
        layers: p.layers.map((l) => {
          if (l.id === p.selectedId) return { ...l, zIndex: next.zIndex };
          if (l.id === next.id) return { ...l, zIndex: ordered[idx].zIndex };
          return l;
        }),
      };
    });
  }, [mutate]);

  const sendBackward = useCallback(() => {
    mutate((p) => {
      if (!p.selectedId) return p;
      const ordered = sortedLayers(p.layers);
      const idx = ordered.findIndex((l) => l.id === p.selectedId);
      if (idx <= 0) return p;
      const prev = ordered[idx - 1];
      return {
        ...p,
        layers: p.layers.map((l) => {
          if (l.id === p.selectedId) return { ...l, zIndex: prev.zIndex };
          if (l.id === prev.id) return { ...l, zIndex: ordered[idx].zIndex };
          return l;
        }),
      };
    });
  }, [mutate]);

  const setWallImage = useCallback(
    (file: File | null) => {
      mutate((p) => {
        if (p.wallPreviewUrl) URL.revokeObjectURL(p.wallPreviewUrl);
        return {
          ...p,
          wallImage: file,
          wallPreviewUrl: file ? URL.createObjectURL(file) : null,
          wallPresetId: file ? null : p.wallPresetId,
        };
      });
    },
    [mutate]
  );

  const applyWallPreset = useCallback(
    async (presetId: string) => {
      const file = await createWallPresetFile(presetId);
      mutate((p) => {
        if (p.wallPreviewUrl) URL.revokeObjectURL(p.wallPreviewUrl);
        return {
          ...p,
          wallImage: file,
          wallPreviewUrl: URL.createObjectURL(file),
          wallPresetId: presetId,
        };
      });
    },
    [mutate]
  );

  const setCanvasZoom = useCallback(
    (zoom: number) => mutate((p) => ({ ...p, canvasZoom: zoom }), false),
    [mutate]
  );

  const zoomIn = useCallback(() => {
    mutate(
      (p) => ({
        ...p,
        canvasZoom: Math.min(ZOOM_MAX, +(p.canvasZoom + 0.1).toFixed(2)),
      }),
      false
    );
  }, [mutate]);

  const zoomOut = useCallback(() => {
    mutate(
      (p) => ({
        ...p,
        canvasZoom: Math.max(ZOOM_MIN, +(p.canvasZoom - 0.1).toFixed(2)),
      }),
      false
    );
  }, [mutate]);

  const resetView = useCallback(() => {
    mutate((p) => ({ ...p, canvasZoom: 1 }), false);
  }, [mutate]);

  const fitToScreen = useCallback(() => {
    mutate((p) => {
      const pad = 80;
      const zoom = Math.min(
        ZOOM_MAX,
        Math.max(
          ZOOM_MIN,
          Math.min(
            (viewportSize.width - pad) / 600,
            (viewportSize.height - pad) / 400
          )
        )
      );
      return { ...p, canvasZoom: +zoom.toFixed(2) };
    }, false);
  }, [mutate, viewportSize]);

  const value = useMemo(
    () => ({
      state,
      stageRef,
      viewportSize,
      setViewportSize,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      undo,
      redo,
      selectLayer,
      updateLayer,
      addTextLayer,
      addLogoFromFile,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      setWallImage,
      applyWallPreset,
      setCanvasZoom,
      zoomIn,
      zoomOut,
      resetView,
      fitToScreen,
    }),
    [
      state,
      viewportSize,
      historyIndex,
      history.length,
      undo,
      redo,
      selectLayer,
      updateLayer,
      addTextLayer,
      addLogoFromFile,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      setWallImage,
      applyWallPreset,
      setCanvasZoom,
      zoomIn,
      zoomOut,
      resetView,
      fitToScreen,
    ]
  );

  return (
    <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>
  );
}
