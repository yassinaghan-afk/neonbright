"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type Konva from "konva";
import { ZOOM_MAX, ZOOM_MIN } from "@/lib/designer/constants";
import { loadEditorState, saveEditorState } from "@/lib/designer/editor/persist";
import {
  createLogoLayer,
  createTextLayer,
  INITIAL_EDITOR_STATE,
  type EditorFocus,
  type EditorState,
  type NeonLayer,
  type PlexiglassPanel,
} from "@/lib/designer/editor/types";
import {
  autoPlexiglassSize,
  defaultPlexiglassForLayer,
  isPlexiglassBackboard,
} from "@/lib/designer/plexiglass";
import { createWallPresetFile, isTransparentWall } from "@/lib/designer/wallPresets";
import type { DisplayMode, NeonTubeStyle } from "@/lib/designer/neonTubeStyles";

const HISTORY_LIMIT = 40;
const AUTOSAVE_MS = 500;

type DesignerContextValue = {
  state: EditorState;
  stageRef: RefObject<Konva.Stage | null>;
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  restoredFromSave: boolean;
  boundaryWarning: string | null;
  clearBoundaryWarning: () => void;
  setBoundaryWarning: (msg: string | null) => void;
  selectLayer: (id: string | null) => void;
  selectFocus: (focus: EditorFocus) => void;
  updateLayer: (id: string, patch: Partial<NeonLayer>, recordHistory?: boolean) => void;
  updatePlexiglass: (patch: Partial<PlexiglassPanel>, recordHistory?: boolean) => void;
  resetPlexiglassToSign: () => void;
  addTextLayer: () => void;
  addLogoFromFile: (file: File) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setWallImage: (file: File | null) => void;
  applyWallPreset: (presetId: string) => Promise<void>;
  setBackboardType: (type: EditorState["backboardType"]) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setNeonStyle: (style: NeonTubeStyle) => void;
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
    plexiglass: s.plexiglass ? { ...s.plexiglass } : null,
  };
}

function activeTextLayer(state: EditorState): NeonLayer | undefined {
  return (
    state.layers.find((l) => l.id === state.selectedId && l.type === "text") ??
    state.layers.find((l) => l.type === "text")
  );
}

function withAutoPlexiglass(state: EditorState, layerId: string): EditorState {
  if (!state.plexiglass || state.plexiglass.manual || !isPlexiglassBackboard(state.backboardType)) {
    return state;
  }
  const layer = state.layers.find((l) => l.id === layerId && l.type === "text");
  if (!layer) return state;
  return { ...state, plexiglass: autoPlexiglassSize(layer, state.plexiglass) };
}

export function DesignerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(INITIAL_EDITOR_STATE);
  const [history, setHistory] = useState<EditorState[]>([cloneState(INITIAL_EDITOR_STATE)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  const [hydrated, setHydrated] = useState(false);
  const [restoredFromSave, setRestoredFromSave] = useState(false);
  const [boundaryWarning, setBoundaryWarning] = useState<string | null>(null);

  const stageRef = useRef<Konva.Stage | null>(null);
  const historyRef = useRef<EditorState[]>([cloneState(INITIAL_EDITOR_STATE)]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((next: EditorState) => {
    const idx = historyIndexRef.current;
    const trimmed = historyRef.current.slice(0, idx + 1);
    const updated = [...trimmed, cloneState(next)].slice(-HISTORY_LIMIT);
    historyRef.current = updated;
    historyIndexRef.current = updated.length - 1;
    setHistory(updated);
    setHistoryIndex(historyIndexRef.current);
  }, []);

  const mutate = useCallback(
    (fn: (prev: EditorState) => EditorState, recordHistory = true) => {
      setState((prev) => {
        const next = fn(prev);
        if (recordHistory) pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = cloneState(historyRef.current[historyIndexRef.current]);
    setHistoryIndex(historyIndexRef.current);
    setState(snap);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snap = cloneState(historyRef.current[historyIndexRef.current]);
    setHistoryIndex(historyIndexRef.current);
    setState(snap);
  }, []);

  useEffect(() => {
    const loaded = loadEditorState();
    if (loaded) {
      const snap = cloneState(loaded);
      historyRef.current = [snap];
      historyIndexRef.current = 0;
      setHistory([snap]);
      setHistoryIndex(0);
      setState(loaded);
      setRestoredFromSave(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => saveEditorState(state), AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [state, hydrated]);

  const selectLayer = useCallback(
    (id: string | null) =>
      mutate((p) => ({ ...p, selectedId: id, focus: "sign" as EditorFocus }), false),
    [mutate]
  );

  const selectFocus = useCallback(
    (focus: EditorFocus) => mutate((p) => ({ ...p, focus }), false),
    [mutate]
  );

  const updateLayer = useCallback(
    (id: string, patch: Partial<NeonLayer>, recordHistory = true) => {
      mutate((p) => withAutoPlexiglass({
        ...p,
        layers: p.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }, id), recordHistory);
    },
    [mutate]
  );

  const updatePlexiglass = useCallback(
    (patch: Partial<PlexiglassPanel>, recordHistory = true) => {
      mutate((p) => {
        if (!p.plexiglass) return p;
        return {
          ...p,
          focus: "plexiglass",
          plexiglass: {
            ...p.plexiglass,
            ...patch,
            manual: patch.manual !== undefined ? patch.manual : true,
          },
        };
      }, recordHistory);
    },
    [mutate]
  );

  const resetPlexiglassToSign = useCallback(() => {
    mutate((p) => {
      const layer = activeTextLayer(p);
      if (!layer || !isPlexiglassBackboard(p.backboardType)) return p;
      return { ...p, plexiglass: defaultPlexiglassForLayer(layer) };
    });
  }, [mutate]);

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
      const next = layers.find((l) => l.type === "text") ?? layers[0];
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
      if (isTransparentWall(presetId)) {
        mutate((p) => {
          if (p.wallPreviewUrl) URL.revokeObjectURL(p.wallPreviewUrl);
          return {
            ...p,
            wallImage: null,
            wallPreviewUrl: null,
            wallPresetId: presetId,
          };
        });
        return;
      }

      const file = await createWallPresetFile(presetId);
      if (!file) return;

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

  const wallRestoredRef = useRef(false);
  useEffect(() => {
    if (!hydrated || wallRestoredRef.current) return;
    wallRestoredRef.current = true;
    if (
      state.wallPresetId &&
      !isTransparentWall(state.wallPresetId) &&
      !state.wallPreviewUrl
    ) {
      void applyWallPreset(state.wallPresetId);
    }
  }, [hydrated, state.wallPresetId, state.wallPreviewUrl, applyWallPreset]);

  const setBackboardType = useCallback(
    (type: EditorState["backboardType"]) => {
      mutate((p) => {
        if (!isPlexiglassBackboard(type)) {
          return { ...p, backboardType: type, plexiglass: null, focus: "sign" as EditorFocus };
        }
        const layer = activeTextLayer(p);
        const plexiglass =
          p.plexiglass && p.plexiglass.manual
            ? p.plexiglass
            : layer
              ? defaultPlexiglassForLayer(layer)
              : p.plexiglass;
        return { ...p, backboardType: type, plexiglass, focus: "plexiglass" as EditorFocus };
      });
    },
    [mutate]
  );

  const setDisplayMode = useCallback(
    (mode: DisplayMode) => mutate((p) => ({ ...p, displayMode: mode })),
    [mutate]
  );

  const setNeonStyle = useCallback(
    (style: NeonTubeStyle) => {
      mutate((p) => ({ ...p, neonStyle: style }));
    },
    [mutate]
  );

  const setCanvasZoom = useCallback(
    (zoom: number) =>
      mutate(
        (p) => ({
          ...p,
          canvasZoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +zoom.toFixed(3))),
        }),
        false
      ),
    [mutate]
  );

  const zoomIn = useCallback(() => {
    mutate(
      (p) => ({
        ...p,
        canvasZoom: Math.min(ZOOM_MAX, +(p.canvasZoom * 1.06).toFixed(3)),
      }),
      false
    );
  }, [mutate]);

  const zoomOut = useCallback(() => {
    mutate(
      (p) => ({
        ...p,
        canvasZoom: Math.max(ZOOM_MIN, +(p.canvasZoom * 0.94).toFixed(3)),
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

  const clearBoundaryWarning = useCallback(() => setBoundaryWarning(null), []);

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
      restoredFromSave,
      boundaryWarning,
      clearBoundaryWarning,
      setBoundaryWarning,
      selectLayer,
      selectFocus,
      updateLayer,
      updatePlexiglass,
      resetPlexiglassToSign,
      addTextLayer,
      addLogoFromFile,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      setWallImage,
      applyWallPreset,
      setBackboardType,
      setDisplayMode,
      setNeonStyle,
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
      restoredFromSave,
      boundaryWarning,
      clearBoundaryWarning,
      selectLayer,
      selectFocus,
      updateLayer,
      updatePlexiglass,
      resetPlexiglassToSign,
      addTextLayer,
      addLogoFromFile,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      setWallImage,
      applyWallPreset,
      setBackboardType,
      setDisplayMode,
      setNeonStyle,
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
