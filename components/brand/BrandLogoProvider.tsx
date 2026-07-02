"use client";

import { createContext, useContext } from "react";

type BrandLogoContextValue = {
  logoUrl: string;
};

const BrandLogoContext = createContext<BrandLogoContextValue>({ logoUrl: "" });

export function BrandLogoProvider({
  logoUrl = "",
  children,
}: {
  logoUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <BrandLogoContext.Provider value={{ logoUrl: logoUrl.trim() }}>
      {children}
    </BrandLogoContext.Provider>
  );
}

export function useBrandLogo(): BrandLogoContextValue {
  return useContext(BrandLogoContext);
}
