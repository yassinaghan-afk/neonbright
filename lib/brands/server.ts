import {
  getPartnerLogosFromMedia,
  isLogoMediaSyncEnabled,
  logoFilenameFromSrc,
} from "@/lib/cms/logo-media";
import { readCMSContent } from "@/lib/cms/store";
import { resolvePublicAsset } from "@/lib/media/public-asset";
import {
  getBrandProfileFromCMS,
  getBrandSlugsFromCMS,
  resolveBrandsFromCMS,
} from "@/lib/cms/portfolio";
import {
  getBrandStats,
  type ResolvedBrand,
} from "@/lib/brands/types";

export type { ResolvedBrand } from "@/lib/brands/types";
export {
  brandsCategory,
  brandFilters,
  brandHref,
  filterBrands,
} from "@/lib/brands/types";

async function buildLogoMap(): Promise<Map<string, string>> {
  if (isLogoMediaSyncEnabled()) {
    const logos = await getPartnerLogosFromMedia();
    const map = new Map<string, string>();
    for (const logo of logos) {
      map.set(logoFilenameFromSrc(logo.src), logo.src);
    }
    return map;
  }

  const content = await readCMSContent();
  const map = new Map<string, string>();
  for (const p of content.portfolioProjects) {
    if (!p.logoFile) continue;
    const src = resolvePublicAsset(
      `/media/logo/${encodeURIComponent(p.logoFile)}`
    );
    if (src) map.set(p.logoFile, src);
  }
  return map;
}

export async function getResolvedBrands(): Promise<ResolvedBrand[]> {
  const logoMap = await buildLogoMap();
  return resolveBrandsFromCMS(logoMap);
}

export async function getResolvedBrand(
  slug: string
): Promise<ResolvedBrand | undefined> {
  const logoMap = await buildLogoMap();
  const profile = await getBrandProfileFromCMS(slug);
  if (!profile || !profile.logoFile || !logoMap.has(profile.logoFile)) {
    return undefined;
  }
  return {
    ...profile,
    logoSrc: logoMap.get(profile.logoFile)!,
  };
}

export async function getBrandSlugs(): Promise<string[]> {
  return getBrandSlugsFromCMS();
}

export function getBrandCategoryStats(brands: ResolvedBrand[]) {
  return getBrandStats(brands);
}
