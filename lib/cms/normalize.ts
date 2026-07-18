import type { CMSHeroSlide, CMSPartner } from "@/lib/cms/types";

export function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizeHeroSlides(
  slides: Partial<CMSHeroSlide>[] | undefined,
  fallback: CMSHeroSlide[]
): CMSHeroSlide[] {
  if (!slides?.length) return fallback;
  return sortByOrder(
    slides.map((s, i) => {
      const slide: CMSHeroSlide = {
        id: s.id ?? `slide_${i}`,
        src: s.src ?? "",
        alt: s.alt ?? "",
        enabled: s.enabled ?? true,
        sortOrder: s.sortOrder ?? i,
      };
      if (s.desktopImageUrl) slide.desktopImageUrl = s.desktopImageUrl;
      if (s.mobileImageUrl) slide.mobileImageUrl = s.mobileImageUrl;
      return slide;
    })
  ).filter((s) => s.src);
}

export function normalizePartners(
  partners: Partial<CMSPartner>[] | undefined,
  fallback: CMSPartner[]
): CMSPartner[] {
  if (!Array.isArray(partners)) return fallback;
  if (partners.length === 0) return [];
  return sortByOrder(
    partners.map((p, i) => ({
      id: p.id ?? `partner_${i}`,
      name: p.name ?? "",
      logoUrl: p.logoUrl ?? "",
      enabled: p.enabled ?? true,
      sortOrder: p.sortOrder ?? i,
    }))
  );
}

export function reorderItems<T extends { id: string; sortOrder: number }>(
  items: T[],
  orderedIds: string[]
): T[] {
  const map = new Map(items.map((item) => [item.id, item]));
  const reordered: T[] = [];
  orderedIds.forEach((id, index) => {
    const item = map.get(id);
    if (item) reordered.push({ ...item, sortOrder: index });
  });
  items.forEach((item) => {
    if (!orderedIds.includes(item.id)) {
      reordered.push({ ...item, sortOrder: reordered.length });
    }
  });
  return reordered;
}
