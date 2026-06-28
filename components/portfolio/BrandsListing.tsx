"use client";

import Link from "next/link";
import type { ResolvedBrand } from "@/lib/brands/types";
import { BrandCard } from "@/components/portfolio/BrandCard";

type BrandsListingProps = {
  brands: ResolvedBrand[];
};

export function BrandsListing({ brands }: BrandsListingProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {brands.map((brand) => (
          <BrandCard key={brand.slug} brand={brand} />
        ))}
      </div>

      <div className="mt-12 text-center sm:mt-16">
        <Link
          href="/#quote"
          className="text-sm text-white/45 transition-colors hover:text-neon-pink"
        >
          Demander un projet pour votre marque →
        </Link>
      </div>
    </>
  );
}
