"use client";

import { useRef, useCallback, type PointerEvent } from "react";
import { useSignage } from "./SignageContext";
import { cn } from "@/lib/utils";
import type { SignageTypeId } from "@/lib/signage/types";

function signGlow(intensity: number, isNight: boolean): string {
  const a = (intensity / 100) * (isNight ? 0.95 : 0.45);
  return `0 0 ${12 + intensity * 0.3}px rgba(255, 220, 140, ${a}), 0 0 ${40 + intensity * 0.6}px rgba(255, 180, 80, ${a * 0.5})`;
}

function SignFace({
  signType,
  businessName,
  logoUrl,
  widthPx,
  heightPx,
  lightingIntensity,
  isNight,
}: {
  signType: SignageTypeId;
  businessName: string;
  logoUrl: string | null;
  widthPx: number;
  heightPx: number;
  lightingIntensity: number;
  isNight: boolean;
}) {
  const glow = signGlow(lightingIntensity, isNight);
  const showLogo = logoUrl && (signType === "logo-lumineux" || signType === "lettres-boitiers" || signType === "enseigne-lumineuse");

  if (signType === "totem") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="max-h-[55%] max-w-[80%] object-contain" />
        ) : null}
        <p
          className="text-center font-bold uppercase tracking-wider text-white"
          style={{
            fontSize: Math.max(10, widthPx * 0.055),
            textShadow: isNight ? glow : "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {businessName}
        </p>
      </div>
    );
  }

  if (signType === "lettres-boitiers") {
    return (
      <div className="flex h-full items-center justify-center p-2">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="max-h-[70%] max-w-[75%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
        ) : (
          <p
            className="text-center font-black uppercase"
            style={{
              fontSize: Math.max(11, heightPx * 0.42),
              color: isNight ? "#fff8e8" : "#2a2520",
              textShadow: isNight
                ? `${glow}, 0 3px 0 #8a6a30, 0 6px 12px rgba(0,0,0,0.5)`
                : "0 2px 0 #c4b896, 0 4px 8px rgba(0,0,0,0.25)",
              WebkitTextStroke: isNight ? "0.5px rgba(255,220,150,0.3)" : "0.5px rgba(0,0,0,0.15)",
            }}
          >
            {businessName}
          </p>
        )}
      </div>
    );
  }

  if (signType === "caisson-lumineux") {
    return (
      <div
        className="flex h-full items-center justify-center p-3"
        style={{
          background: isNight
            ? `radial-gradient(ellipse at center, rgba(255,248,220,${0.15 + lightingIntensity / 400}) 0%, rgba(255,200,100,0.05) 70%)`
            : "rgba(255,255,255,0.92)",
        }}
      >
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="max-h-[75%] max-w-[85%] object-contain"
            style={{ filter: isNight ? "brightness(1.15)" : "none" }}
          />
        ) : (
          <p
            className="text-center font-bold uppercase tracking-wide"
            style={{
              fontSize: Math.max(10, heightPx * 0.38),
              color: isNight ? "#1a1510" : "#1a1510",
            }}
          >
            {businessName}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center gap-3 p-3">
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="max-h-[70%] max-w-[40%] object-contain"
          style={{ filter: isNight ? `drop-shadow(${glow})` : "none" }}
        />
      ) : null}
      <p
        className={cn(
          "text-center font-bold uppercase tracking-wide",
          showLogo ? "max-w-[50%]" : "w-full"
        )}
        style={{
          fontSize: Math.max(10, heightPx * (showLogo ? 0.28 : 0.38)),
          color: isNight ? "#fff5e0" : "#f0ebe3",
          textShadow: isNight ? glow : "0 1px 3px rgba(0,0,0,0.5)",
        }}
      >
        {businessName}
      </p>
    </div>
  );
}

function signShellClass(signType: SignageTypeId, isNight: boolean): string {
  const base = "relative overflow-hidden transition-all duration-500";
  switch (signType) {
    case "lettres-boitiers":
      return cn(base, "rounded-sm bg-transparent");
    case "caisson-lumineux":
      return cn(
        base,
        "rounded-md border-2",
        isNight ? "border-amber-200/30 bg-[#f5f0e6]" : "border-white/40 bg-white"
      );
    case "enseigne-led":
      return cn(
        base,
        "rounded-sm border",
        isNight ? "border-cyan-400/40 bg-[#0a1628]" : "border-slate-400/50 bg-slate-800"
      );
    case "totem":
      return cn(
        base,
        "rounded-lg border-2",
        isNight ? "border-white/20 bg-gradient-to-b from-[#1a1a22] to-[#0d0d12]" : "border-slate-500/40 bg-gradient-to-b from-slate-700 to-slate-800"
      );
    case "facade":
      return cn(
        base,
        "rounded-none border-y-4",
        isNight ? "border-amber-300/25 bg-[#12100e]" : "border-slate-600/50 bg-slate-900"
      );
  }
  return cn(
    base,
    "rounded-md border",
    isNight ? "border-amber-200/20 bg-[#141210]" : "border-slate-500/40 bg-slate-800/90"
  );
}

export function SignageFacadeScene() {
  const { state, updatePosition } = useSignage();
  const facadeRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const isNight = state.timeOfDay === "night";

  const signWidthPx = Math.round((state.signWidthCm / 400) * 520);
  const signHeightPx =
    state.signType === "totem"
      ? Math.round(signWidthPx * 2.8)
      : Math.round((state.signHeightCm / 120) * 90);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !facadeRef.current) return;
      const rect = facadeRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      updatePosition(x, y);
    },
    [updatePosition]
  );

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const facadeAccent =
    state.facadeType === "hotel"
      ? "from-stone-600/80 to-stone-800/90"
      : state.facadeType === "restaurant"
        ? "from-amber-900/50 to-stone-800/90"
        : state.facadeType === "office"
          ? "from-slate-600/70 to-slate-800/90"
          : "from-stone-700/70 to-stone-900/90";

  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#060608]">
      {/* Sky */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: isNight
            ? "linear-gradient(180deg, #020208 0%, #0a0a18 35%, #12101a 70%, #1a1818 100%)"
            : "linear-gradient(180deg, #6eb5e8 0%, #a8d4f0 40%, #d4e8f5 75%, #e8f0e8 100%)",
        }}
      />

      {/* Stars (night) */}
      {isNight && (
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 15%, #fff, transparent), radial-gradient(1px 1px at 60% 8%, #fff, transparent), radial-gradient(1px 1px at 80% 22%, #fff, transparent), radial-gradient(1px 1px at 35% 25%, #fff, transparent), radial-gradient(1px 1px at 90% 12%, #fff, transparent)",
          }}
        />
      )}

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[18%] transition-colors duration-700"
        style={{
          background: isNight
            ? "linear-gradient(180deg, #1a1818 0%, #0a0a0a 100%)"
            : "linear-gradient(180deg, #8a9a7a 0%, #6a7a5a 100%)",
        }}
      />

      {/* 3D Scene */}
      <div
        className="relative z-10 w-full max-w-3xl px-4"
        style={{ perspective: "1400px", perspectiveOrigin: "50% 40%" }}
      >
        <div
          className="relative mx-auto transition-transform duration-700"
          style={{
            transform: "rotateX(6deg) rotateY(-8deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Building */}
          <div
            ref={facadeRef}
            className={cn(
              "relative mx-auto aspect-[16/11] w-full max-w-2xl overflow-hidden rounded-t-sm shadow-2xl transition-all duration-700",
              `bg-gradient-to-b ${facadeAccent}`
            )}
            style={{
              boxShadow: isNight
                ? "0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)"
                : "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {/* Roof line */}
            <div
              className="absolute -top-3 left-[-2%] right-[-2%] h-4 rounded-t-sm"
              style={{
                background: isNight ? "#2a2828" : "#5a5650",
                transform: "translateZ(8px)",
              }}
            />

            {/* Upper facade band */}
            <div className="absolute inset-x-0 top-0 h-[22%] bg-black/20" />

            {/* Windows row */}
            <div className="absolute inset-x-[8%] top-[28%] flex justify-between gap-[3%]">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] flex-1 rounded-sm border transition-all duration-700"
                  style={{
                    background: isNight
                      ? `rgba(255, ${180 + i * 15}, 100, ${0.15 + (state.lightingIntensity / 500)})`
                      : "rgba(180, 210, 240, 0.55)",
                    borderColor: isNight ? "rgba(255,220,150,0.15)" : "rgba(255,255,255,0.3)",
                    boxShadow: isNight
                      ? `inset 0 0 ${8 + state.lightingIntensity * 0.1}px rgba(255,200,100,0.2)`
                      : "inset 0 0 20px rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>

            {/* Storefront / entrance */}
            <div className="absolute inset-x-[18%] bottom-0 top-[58%] rounded-t-md border-x border-t border-white/10 bg-black/30">
              <div
                className="absolute inset-2 rounded-t-sm border border-white/5"
                style={{
                  background: isNight
                    ? "linear-gradient(180deg, rgba(20,25,35,0.9) 0%, rgba(10,12,18,0.95) 100%)"
                    : "linear-gradient(180deg, rgba(60,70,85,0.5) 0%, rgba(30,35,45,0.7) 100%)",
                }}
              />
              {/* Door */}
              <div className="absolute bottom-0 left-1/2 h-[75%] w-[28%] -translate-x-1/2 rounded-t-sm border border-white/10 bg-black/40" />
              {/* Awning for retail/restaurant */}
              {(state.facadeType === "retail" || state.facadeType === "restaurant") && (
                <div
                  className={cn(
                    "absolute -top-3 left-[5%] right-[5%] h-4 rounded-sm",
                    state.facadeType === "restaurant" ? "bg-red-900/70" : "bg-stone-700/80"
                  )}
                  style={{ transform: "translateZ(4px)" }}
                />
              )}
            </div>

            {/* Sign mount — draggable */}
            <div
              className="absolute z-20 cursor-grab touch-none active:cursor-grabbing"
              style={{
                left: `${state.positionX}%`,
                top: `${state.positionY}%`,
                transform: `translate(-50%, -50%) ${state.signType === "totem" ? "translateY(15%)" : ""}`,
                width: signWidthPx,
                height: signHeightPx,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* LED edge dots */}
              {state.signType === "enseigne-led" && isNight && (
                <div className="pointer-events-none absolute inset-0 rounded-sm">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute h-1 w-1 rounded-full bg-cyan-300"
                      style={{
                        left: i < 12 ? `${(i / 11) * 100}%` : i < 18 ? "100%" : "0%",
                        top: i < 12 ? "0" : i < 18 ? `${((i - 12) / 5) * 100}%` : `${((i - 18) / 5) * 100}%`,
                        boxShadow: `0 0 4px rgba(56, 189, 248, ${state.lightingIntensity / 100})`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  ))}
                </div>
              )}

              <div
                className={signShellClass(state.signType, isNight)}
                style={{
                  width: "100%",
                  height: "100%",
                  boxShadow: isNight
                    ? `${signGlow(state.lightingIntensity, true)}, 0 8px 24px rgba(0,0,0,0.5)`
                    : "0 6px 20px rgba(0,0,0,0.35)",
                }}
              >
                <SignFace
                  signType={state.signType}
                  businessName={state.businessName}
                  logoUrl={state.logoUrl}
                  widthPx={signWidthPx}
                  heightPx={signHeightPx}
                  lightingIntensity={state.lightingIntensity}
                  isNight={isNight}
                />
              </div>

              {/* Mount brackets */}
              {state.signType !== "totem" && state.signType !== "facade" && (
                <>
                  <div className="absolute -bottom-2 left-[15%] h-2 w-1 rounded-full bg-zinc-500" />
                  <div className="absolute -bottom-2 right-[15%] h-2 w-1 rounded-full bg-zinc-500" />
                </>
              )}
            </div>

            {/* Facade-wide sign strip */}
            {state.signType === "facade" && (
              <div
                className="pointer-events-none absolute inset-x-0 top-[8%] h-[3px] opacity-30"
                style={{ background: isNight ? "rgba(255,200,100,0.4)" : "rgba(0,0,0,0.2)" }}
              />
            )}
          </div>

          {/* Sidewalk */}
          <div
            className="mx-auto h-6 w-[108%] -translate-x-[4%] rounded-b-sm transition-colors duration-700"
            style={{
              background: isNight ? "#2a2a2a" : "#9a9a8a",
              transform: "rotateX(90deg) translateZ(-12px) translateY(-12px)",
              transformOrigin: "top center",
            }}
          />
        </div>
      </div>

      {/* Mode badge */}
      <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur-sm">
        {isNight ? "Mode Nuit" : "Mode Jour"}
      </div>

      <p className="absolute bottom-3 right-4 text-[10px] text-white/30">
        Glissez l&apos;enseigne pour ajuster la position
      </p>
    </div>
  );
}
