"use client";

import dynamic from "next/dynamic";
import { SignageProvider } from "./SignageContext";

const SignageDesigner = dynamic(
  () => import("./SignageDesigner").then((m) => m.SignageDesigner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-[#050505]">
        <p className="text-sm text-white/40">
          Chargement du configurateur enseigne…
        </p>
      </div>
    ),
  }
);

export function SignageDesignerClient() {
  return (
    <SignageProvider>
      <SignageDesigner />
    </SignageProvider>
  );
}
