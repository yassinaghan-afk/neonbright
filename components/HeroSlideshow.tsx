"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { CMSHeroSlide } from "@/lib/cms/types";

const SLIDE_MS = 5500;
const FADE_S = 2;
const MOTION_S = SLIDE_MS / 1000 + FADE_S;

type KenBurnsPreset = {
  scale: [number, number];
  x: [string, string];
  y: [string, string];
};

const KEN_BURNS_PRESETS: KenBurnsPreset[] = [
  { scale: [1, 1.06], x: ["0%", "-1.8%"], y: ["0%", "-1.2%"] },
  { scale: [1.06, 1], x: ["-1.8%", "0.5%"], y: ["-1.2%", "0.8%"] },
  { scale: [1.02, 1.07], x: ["1.2%", "-1%"], y: ["0.5%", "-0.8%"] },
  { scale: [1.07, 1.01], x: ["-1%", "1.5%"], y: ["-0.6%", "0.6%"] },
];

function presetForSlide(id: string): KenBurnsPreset {
  const hash = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return KEN_BURNS_PRESETS[hash % KEN_BURNS_PRESETS.length];
}

type HeroSlideshowProps = {
  slides: CMSHeroSlide[];
};

export function HeroSlideshow({ slides }: HeroSlideshowProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [animEpoch, setAnimEpoch] = useState<Record<string, number>>({});
  const images = slides.length > 0 ? slides : [];

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) return;
    const slide = images[active];
    if (!slide) return;
    setAnimEpoch((prev) => ({
      ...prev,
      [slide.id]: (prev[slide.id] ?? 0) + 1,
    }));
  }, [active, images]);

  useEffect(() => {
    images.forEach((slide) => {
      const img = new window.Image();
      img.src = slide.src;
    });
  }, [images]);

  const motionDuration = useMemo(
    () => (reduceMotion ? 0.01 : MOTION_S),
    [reduceMotion]
  );

  if (images.length === 0) {
    return (
      <div
        className="pointer-events-none absolute inset-0 bg-[#050505]"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#050505]"
      aria-hidden
    >
      {images.map((slide, i) => {
        const isActive = i === active;
        const preset = presetForSlide(slide.id);
        const epoch = animEpoch[slide.id] ?? 0;

        return (
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{
              opacity: {
                duration: reduceMotion ? 0.01 : FADE_S,
                ease: [0.45, 0.05, 0.15, 1],
              },
            }}
            style={{ zIndex: isActive ? 2 : 1 }}
          >
            <motion.div
              key={`${slide.id}-${epoch}`}
              className="absolute inset-[2%] origin-center will-change-transform sm:inset-0"
              initial={
                reduceMotion
                  ? { scale: 1, x: "0%", y: "0%" }
                  : {
                      scale: preset.scale[0],
                      x: preset.x[0],
                      y: preset.y[0],
                    }
              }
              animate={
                reduceMotion
                  ? { scale: 1, x: "0%", y: "0%" }
                  : {
                      scale: preset.scale[1],
                      x: preset.x[1],
                      y: preset.y[1],
                    }
              }
              transition={{
                scale: { duration: motionDuration, ease: "linear" },
                x: { duration: motionDuration, ease: "linear" },
                y: { duration: motionDuration, ease: "linear" },
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={i <= 1}
                sizes="100vw"
                quality={85}
                className="object-cover object-center"
              />
            </motion.div>
          </motion.div>
        );
      })}

      <div className="absolute inset-0 z-10 bg-black/50" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050505]/92 via-[#050505]/72 to-[#050505]/40" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050505]/90 via-transparent to-[#050505]/55" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_25%_50%,rgba(255,45,149,0.05)_0%,transparent_55%)]" />
    </div>
  );
}
