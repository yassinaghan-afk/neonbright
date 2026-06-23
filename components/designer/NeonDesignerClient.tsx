"use client";

import dynamic from "next/dynamic";
import { DesignerErrorBoundary } from "./DesignerErrorBoundary";

const NeonDesigner = dynamic(
  () => import("./NeonDesigner").then((m) => m.NeonDesigner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-[#050505]">
        <p className="text-sm text-white/40">Loading Neon Preview Studio…</p>
      </div>
    ),
  }
);

export function NeonDesignerClient() {
  return (
    <DesignerErrorBoundary>
      <NeonDesigner />
    </DesignerErrorBoundary>
  );
}
