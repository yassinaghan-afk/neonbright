import { normalizeBackboardType, type BackboardType } from "../backboards";
import { TUBE_STYLE_DEFAULT, type DisplayMode, type NeonTubeStyle } from "../neonTubeStyles";
import { createTextLayer, INITIAL_EDITOR_STATE, type EditorFocus, type EditorState, type NeonLayer, type PlexiglassPanel } from "./types";

const STORAGE_KEY = "neonbright-designer-v1";
const VERSION = 3;

type PersistedLayer = Omit<NeonLayer, "file" | "imageUrl"> & {
  imageUrl: null;
  file?: undefined;
  tubeStyle?: number;
  tubeThickness?: number;
  tubeMode?: string;
};

type PersistedPayload = {
  version: number;
  layers: PersistedLayer[];
  selectedId: string | null;
  focus?: EditorFocus;
  plexiglass?: PlexiglassPanel | null;
  displayMode?: DisplayMode;
  canvasZoom: number;
  wallPresetId: string | null;
  backboardType: BackboardType;
  neonStyle: NeonTubeStyle;
  savedAt: number;
};

function stripLayer(layer: NeonLayer): PersistedLayer {
  const { file: _file, imageUrl: _url, ...rest } = layer;
  return { ...rest, imageUrl: null, type: layer.type };
}

function migrateLayer(l: PersistedLayer): NeonLayer {
  const { tubeThickness: _tt, tubeMode: _tm, ...rest } = l;
  let tubeStyle = rest.tubeStyle;
  if (tubeStyle === undefined && typeof _tt === "number") {
    tubeStyle = Math.round((_tt / 8) * 100);
  }
  return {
    ...rest,
    imageUrl: null,
    fileName: null,
    text: rest.text?.trim() || "NEON BRIGHT",
    fontSize: Math.max(28, rest.fontSize || 64),
    glow: typeof rest.glow === "number" ? rest.glow : 35,
    brightness: typeof rest.brightness === "number" ? rest.brightness : 80,
    tubeStyle: Math.max(0, Math.min(100, tubeStyle ?? TUBE_STYLE_DEFAULT)),
  };
}

export function serializeEditorState(state: EditorState): PersistedPayload {
  const textLayers = state.layers.filter((l) => l.type === "text").map(stripLayer);
  const layers = textLayers.length ? textLayers : [stripLayer(createTextLayer())];

  return {
    version: VERSION,
    layers,
    selectedId: state.selectedId,
    focus: state.focus,
    plexiglass: state.plexiglass,
    displayMode: state.displayMode,
    canvasZoom: state.canvasZoom,
    wallPresetId: state.wallPresetId,
    backboardType: state.backboardType,
    neonStyle: state.neonStyle,
    savedAt: Date.now(),
  };
}

export function deserializeEditorState(data: PersistedPayload): EditorState | null {
  if (!data || !Array.isArray(data.layers) || !data.layers.length) {
    return null;
  }

  const layers = data.layers.map(migrateLayer);
  const selectedId = layers.some((l) => l.id === data.selectedId)
    ? data.selectedId
    : layers[0].id;

  const wallPresetId =
    data.wallPresetId === "black-wall" || !data.wallPresetId
      ? INITIAL_EDITOR_STATE.wallPresetId
      : data.wallPresetId;

  const displayMode: DisplayMode =
    data.displayMode ??
    (data.layers[0]?.tubeMode === "double" ? "double" : "single");

  return {
    layers,
    selectedId,
    focus: data.focus ?? "sign",
    plexiglass: data.plexiglass ?? null,
    displayMode,
    canvasZoom: Math.min(2, Math.max(0.25, data.canvasZoom ?? 1)),
    wallPreviewUrl: null,
    wallImage: null,
    wallPresetId,
    backboardType: normalizeBackboardType(data.backboardType ?? INITIAL_EDITOR_STATE.backboardType),
    neonStyle: data.neonStyle ?? INITIAL_EDITOR_STATE.neonStyle,
  };
}

export function saveEditorState(state: EditorState): void {
  if (typeof window === "undefined") return;
  try {
    const payload = serializeEditorState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

export function loadEditorState(): EditorState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deserializeEditorState(JSON.parse(raw) as PersistedPayload);
  } catch {
    return null;
  }
}

export function clearSavedEditorState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
