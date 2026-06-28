"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_SIGNAGE_STATE,
  type FacadeType,
  type SignageState,
  type SignageTypeId,
  type TimeOfDay,
} from "@/lib/signage/types";

type SignageContextValue = {
  state: SignageState;
  setSignType: (id: SignageTypeId) => void;
  setBusinessName: (name: string) => void;
  setLogo: (file: File | null) => void;
  clearLogo: () => void;
  setSignWidthCm: (cm: number) => void;
  setSignHeightCm: (cm: number) => void;
  setPositionX: (pct: number) => void;
  setPositionY: (pct: number) => void;
  setLightingIntensity: (v: number) => void;
  setTimeOfDay: (mode: TimeOfDay) => void;
  setFacadeType: (type: FacadeType) => void;
  updatePosition: (x: number, y: number) => void;
};

const SignageContext = createContext<SignageContextValue | null>(null);

export function useSignage() {
  const ctx = useContext(SignageContext);
  if (!ctx) throw new Error("useSignage must be used within SignageProvider");
  return ctx;
}

export function SignageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SignageState>(INITIAL_SIGNAGE_STATE);

  const mutate = useCallback((fn: (prev: SignageState) => SignageState) => {
    setState(fn);
  }, []);

  const setSignType = useCallback(
    (id: SignageTypeId) => mutate((p) => ({ ...p, signType: id })),
    [mutate]
  );

  const setBusinessName = useCallback(
    (businessName: string) => mutate((p) => ({ ...p, businessName })),
    [mutate]
  );

  const setLogo = useCallback(
    (file: File | null) => {
      mutate((p) => {
        if (p.logoUrl) URL.revokeObjectURL(p.logoUrl);
        if (!file) return { ...p, logoFile: null, logoUrl: null };
        return {
          ...p,
          logoFile: file,
          logoUrl: URL.createObjectURL(file),
        };
      });
    },
    [mutate]
  );

  const clearLogo = useCallback(() => setLogo(null), [setLogo]);

  const setSignWidthCm = useCallback(
    (signWidthCm: number) =>
      mutate((p) => ({ ...p, signWidthCm: Math.round(signWidthCm) })),
    [mutate]
  );

  const setSignHeightCm = useCallback(
    (signHeightCm: number) =>
      mutate((p) => ({ ...p, signHeightCm: Math.round(signHeightCm) })),
    [mutate]
  );

  const setPositionX = useCallback(
    (positionX: number) =>
      mutate((p) => ({ ...p, positionX: Math.min(85, Math.max(15, positionX)) })),
    [mutate]
  );

  const setPositionY = useCallback(
    (positionY: number) =>
      mutate((p) => ({ ...p, positionY: Math.min(55, Math.max(12, positionY)) })),
    [mutate]
  );

  const setLightingIntensity = useCallback(
    (lightingIntensity: number) =>
      mutate((p) => ({
        ...p,
        lightingIntensity: Math.min(100, Math.max(20, lightingIntensity)),
      })),
    [mutate]
  );

  const setTimeOfDay = useCallback(
    (timeOfDay: TimeOfDay) => mutate((p) => ({ ...p, timeOfDay })),
    [mutate]
  );

  const setFacadeType = useCallback(
    (facadeType: FacadeType) => mutate((p) => ({ ...p, facadeType })),
    [mutate]
  );

  const updatePosition = useCallback(
    (x: number, y: number) => {
      setPositionX(x);
      setPositionY(y);
    },
    [setPositionX, setPositionY]
  );

  const value = useMemo(
    () => ({
      state,
      setSignType,
      setBusinessName,
      setLogo,
      clearLogo,
      setSignWidthCm,
      setSignHeightCm,
      setPositionX,
      setPositionY,
      setLightingIntensity,
      setTimeOfDay,
      setFacadeType,
      updatePosition,
    }),
    [
      state,
      setSignType,
      setBusinessName,
      setLogo,
      clearLogo,
      setSignWidthCm,
      setSignHeightCm,
      setPositionX,
      setPositionY,
      setLightingIntensity,
      setTimeOfDay,
      setFacadeType,
      updatePosition,
    ]
  );

  return (
    <SignageContext.Provider value={value}>{children}</SignageContext.Provider>
  );
}
