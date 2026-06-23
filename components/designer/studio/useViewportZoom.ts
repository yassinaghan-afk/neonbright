"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ZOOM_MAX, ZOOM_MIN } from "@/lib/designer/constants";

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +z.toFixed(3)));
}

export function useViewportZoom(
  ref: RefObject<HTMLElement | null>,
  zoom: number,
  setZoom: (z: number) => void
) {
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const applyZoom = (next: number) => setZoom(clampZoom(next));

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.94 : 1.06;
      applyZoom(zoomRef.current * factor);
    };

    let pinchStart = 0;
    let zoomStart = 1;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        zoomStart = zoomRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStart === 0) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      applyZoom(zoomStart * (dist / pinchStart));
    };

    const onTouchEnd = () => {
      pinchStart = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, setZoom]);
}
