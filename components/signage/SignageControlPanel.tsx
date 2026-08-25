"use client";

import { useMemo, useRef } from "react";
import { useSignage } from "./SignageContext";
import { SIGN_TYPE_OPTIONS, FACADE_OPTIONS } from "@/lib/signage/signTypes";
import { ENSEIGNE_SIZE_OPTIONS } from "@/lib/signage/sizes";
import {
  estimateSignagePrice,
  formatSignagePrice,
} from "@/lib/signage/pricing";
import { cn } from "@/lib/utils";

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-[11px] font-bold text-neon-purple">
        {step}
      </span>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neon-purple/80">
          Étape {step}
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {title}
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
      {children}
    </p>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/55">{label}</span>
        <span className="font-mono text-white/80">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-neon-purple"
      />
    </div>
  );
}

export function SignageControlPanel() {
  const {
    state,
    setSignType,
    setBusinessName,
    setLogo,
    clearLogo,
    setSizePreset,
    setSignWidthCm,
    setSignHeightCm,
    setPositionX,
    setPositionY,
    setLightingIntensity,
    setTimeOfDay,
    setFacadeType,
  } = useSignage();
  const fileRef = useRef<HTMLInputElement>(null);
  const livePrice = useMemo(() => estimateSignagePrice(state), [state]);

  const onLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogo(file);
    e.target.value = "";
  };

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-white/10 bg-[#080808]">
      <div className="space-y-7 p-4 sm:p-5">
        {/* ── Étape 1 — Contenu ───────────────────────────────────────── */}
        <section>
          <StepHeading step={1} title="Contenu" />

          <div className="space-y-5">
            <div>
              <SectionTitle>Type d&apos;enseigne</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                {SIGN_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSignType(opt.id)}
                    className={cn(
                      "rounded-xl border px-2.5 py-2.5 text-left transition-all",
                      state.signType === opt.id
                        ? "border-neon-purple/50 bg-neon-purple/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    )}
                  >
                    <p className="text-[11px] font-semibold leading-tight text-white">
                      {opt.shortLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-white/40">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Texte</SectionTitle>
              <input
                type="text"
                value={state.businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="VOTRE MARQUE"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-neon-purple/40 focus:outline-none"
              />
            </div>

            <div>
              <SectionTitle>Logo / Image</SectionTitle>
              <input
                ref={fileRef}
                type="file"
                accept=".svg,.png,.jpg,.jpeg,image/svg+xml,image/png,image/jpeg"
                className="hidden"
                onChange={onLogoPick}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3 py-3 text-xs font-medium text-white/70 transition-colors hover:border-neon-purple/40 hover:bg-white/[0.06]"
                >
                  Importer SVG, PNG ou JPG
                </button>
                {state.logoUrl && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="rounded-xl border border-white/10 px-3 text-xs text-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              {state.logoUrl && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.logoUrl}
                    alt="Logo"
                    className="h-10 w-10 object-contain"
                  />
                  <p className="truncate text-[10px] text-white/50">
                    {state.logoFile?.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <SectionTitle>Type de façade</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {FACADE_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacadeType(f.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
                      state.facadeType === f.id
                        ? "border-neon-purple/40 bg-neon-purple/10 text-white"
                        : "border-white/10 text-white/50 hover:border-white/25"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Étape 2 — Taille ────────────────────────────────────────── */}
        <section>
          <StepHeading step={2} title="Taille" />

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {ENSEIGNE_SIZE_OPTIONS.map((opt) => {
                const active = state.sizePreset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSizePreset(opt.id)}
                    className={cn(
                      "rounded-xl border px-3.5 py-3 text-left transition-all",
                      active
                        ? "border-neon-purple/50 bg-neon-purple/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      Taille — {opt.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/80">
                      {opt.rangeLabel}
                    </p>
                    {opt.priceDh != null && (
                      <p
                        className={cn(
                          "mt-2 font-mono text-base font-bold",
                          active ? "text-neon-purple" : "text-white/70"
                        )}
                      >
                        {formatSignagePrice(opt.priceDh)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 border-t border-white/8 pt-4">
              <SectionTitle>Dimensions personnalisées</SectionTitle>
              <SliderRow
                label="Largeur"
                value={state.signWidthCm}
                min={50}
                max={400}
                unit=" cm"
                onChange={setSignWidthCm}
              />
              <SliderRow
                label="Hauteur"
                value={state.signHeightCm}
                min={30}
                max={200}
                unit=" cm"
                onChange={setSignHeightCm}
              />
            </div>

            <div className="space-y-4">
              <SectionTitle>Position sur la façade</SectionTitle>
              <SliderRow
                label="Horizontal"
                value={Math.round(state.positionX)}
                min={15}
                max={85}
                unit="%"
                onChange={setPositionX}
              />
              <SliderRow
                label="Vertical"
                value={Math.round(state.positionY)}
                min={12}
                max={55}
                unit="%"
                onChange={setPositionY}
              />
            </div>
          </div>
        </section>

        {/* ── Étape 3 — Couleur(s) ─────────────────────────────────────── */}
        <section>
          <StepHeading step={3} title="Couleur(s)" />

          <div className="space-y-5">
            <div>
              <SectionTitle>Éclairage</SectionTitle>
              <SliderRow
                label="Intensité lumineuse"
                value={state.lightingIntensity}
                min={20}
                max={100}
                unit="%"
                onChange={setLightingIntensity}
              />
            </div>

            <div>
              <SectionTitle>Visualisation</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimeOfDay("day")}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-semibold transition-all",
                    state.timeOfDay === "day"
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  ☀ Jour
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOfDay("night")}
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-semibold transition-all",
                    state.timeOfDay === "night"
                      ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200"
                      : "border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  ☾ Nuit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Étape 4 — Prix ──────────────────────────────────────────── */}
        <section>
          <StepHeading step={4} title="Prix" />
          <div className="rounded-xl border border-neon-purple/30 bg-neon-purple/8 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Prix
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-neon-purple">
              {formatSignagePrice(livePrice)}
            </p>
            {state.sizePreset && (
              <p className="mt-1.5 text-xs text-white/45">
                {ENSEIGNE_SIZE_OPTIONS.find((o) => o.id === state.sizePreset)
                  ?.rangeLabel ?? null}
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
