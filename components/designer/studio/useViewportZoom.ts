"use client";

import { useEffect, type RefObject } from "react";
import { ZOOM_MAX, ZOOM_MIN } from "@/lib/designer/constants";

export function useViewportZoom(
  ref: RefObject<HTMLElement | null>,
  zoom: number,
  setZoom: (z: number) => void
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +z.toFixed(2)));

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(clamp(zoom + (e.deltaY > 0 ? -0.08 : 0.08)));
    };

    let pinchStart = 0;
    let zoomStart = zoom;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        zoomStart = zoom;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStart === 0) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setZoom(clamp(zoomStart * (dist / pinchStart)));
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
  }, [ref, zoom, setZoom]);
}
