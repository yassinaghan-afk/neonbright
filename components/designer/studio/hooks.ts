"use client";

import { useEffect, useState, type RefObject } from "react";

export function useContainerSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth || 800, height: el.clientHeight || 500 });
    return () => ro.disconnect();
  }, [ref]);

  return size;
}

export function useKonvaImage(url: string | null) {
  const [image, setImage] = useState<HTMLImageElement | undefined>();

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(undefined);
    img.src = url;
  }, [url]);

  return image;
}
