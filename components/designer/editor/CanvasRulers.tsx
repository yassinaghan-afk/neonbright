"use client";

import { useMemo } from "react";
import { PX_PER_CM } from "@/lib/designer/sizes";

export const RULER_SIZE = 28;

type Props = {
  width: number;
  height: number;
  zoom: number;
};

function buildTicks(spanPx: number, zoom: number, majorEvery = 10) {
  const spanCm = spanPx / (PX_PER_CM * zoom);
  const start = Math.floor(-spanCm / 2 / majorEvery) * majorEvery;
  const end = Math.ceil(spanCm / 2 / majorEvery) * majorEvery;
  const ticks: { cm: number; major: boolean }[] = [];
  for (let cm = start; cm <= end; cm++) {
    if (cm % majorEvery === 0 || cm % 5 === 0) {
      ticks.push({ cm, major: cm % majorEvery === 0 });
    }
  }
  return ticks;
}

export function CanvasRulers({ width, height, zoom }: Props) {
  const hTicks = useMemo(() => buildTicks(width, zoom), [width, zoom]);
  const vTicks = useMemo(() => buildTicks(height, zoom), [height, zoom]);

  const cx = width / 2;
  const cy = height / 2;
  const pxPerCm = PX_PER_CM * zoom;

  return (
    <>
      {/* corner square */}
      <div
        className="absolute left-0 top-0 z-20 border-b border-r border-white/12 bg-[#0c0c0c]"
        style={{ width: RULER_SIZE, height: RULER_SIZE }}
      />

      {/* horizontal ruler */}
      <div
        className="absolute top-0 z-20 overflow-hidden border-b border-white/12 bg-[#0c0c0c]"
        style={{ left: RULER_SIZE, width, height: RULER_SIZE }}
      >
        <svg width={width} height={RULER_SIZE} className="block">
          {hTicks.map(({ cm, major }) => {
            const x = cx + cm * pxPerCm;
            if (x < -2 || x > width + 2) return null;
            return (
              <g key={`h-${cm}`}>
                <line
                  x1={x}
                  y1={RULER_SIZE}
                  x2={x}
                  y2={major ? 8 : 14}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={major ? 1 : 0.5}
                />
                {major && cm !== 0 && (
                  <text
                    x={x + 2}
                    y={10}
                    fill="rgba(255,255,255,0.45)"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    {cm}
                  </text>
                )}
              </g>
            );
          })}
          <text x={cx + 3} y={10} fill="rgba(255,45,149,0.7)" fontSize={9} fontFamily="monospace">
            0
          </text>
        </svg>
      </div>

      {/* vertical ruler */}
      <div
        className="absolute left-0 z-20 overflow-hidden border-r border-white/12 bg-[#0c0c0c]"
        style={{ top: RULER_SIZE, width: RULER_SIZE, height }}
      >
        <svg width={RULER_SIZE} height={height} className="block">
          {vTicks.map(({ cm, major }) => {
            const y = cy + cm * pxPerCm;
            if (y < -2 || y > height + 2) return null;
            return (
              <g key={`v-${cm}`}>
                <line
                  x1={RULER_SIZE}
                  y1={y}
                  x2={major ? 8 : 14}
                  y2={y}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={major ? 1 : 0.5}
                />
                {major && cm !== 0 && (
                  <text
                    x={2}
                    y={y - 2}
                    fill="rgba(255,255,255,0.45)"
                    fontSize={8}
                    fontFamily="monospace"
                    transform={`rotate(-90, 2, ${y - 2})`}
                  >
                    {cm}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* cm unit label */}
      <div
        className="pointer-events-none absolute z-20 text-[8px] font-mono text-white/25"
        style={{ left: RULER_SIZE + 4, top: RULER_SIZE + 2 }}
      >
        cm
      </div>
    </>
  );
}
