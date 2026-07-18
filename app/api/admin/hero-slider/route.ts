import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { reorderItems } from "@/lib/cms/normalize";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSHeroSlide } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.heroSlides);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.src) return jsonError("Image URL is required");

  let created: CMSHeroSlide | undefined;
  await updateCMSContent((c) => {
    const item: CMSHeroSlide = {
      id: createId("slide"),
      src: body.src,
      alt: body.alt ?? "",
      enabled: body.enabled ?? true,
      sortOrder: c.heroSlides.length,
    };
    created = item;
    return { ...c, heroSlides: [...c.heroSlides, item] };
  });

  return jsonOk(created, 201);
}

export async function PATCH(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.ids || !Array.isArray(body.ids)) {
    return jsonError("ids array is required");
  }

  let reordered: CMSHeroSlide[] = [];
  await updateCMSContent((c) => {
    reordered = reorderItems(c.heroSlides, body.ids as string[]);
    return { ...c, heroSlides: reordered };
  });

  return jsonOk(reordered);
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.slides || !Array.isArray(body.slides)) {
    return jsonError("slides array is required");
  }

  let saved: CMSHeroSlide[] = [];
  await updateCMSContent((c) => {
    saved = (body.slides as Partial<CMSHeroSlide>[]).map((s, i) => {
      const slide: CMSHeroSlide = {
        id: s.id ?? createId("slide"),
        src: s.src ?? "",
        alt: s.alt ?? "",
        enabled: s.enabled ?? true,
        sortOrder: i,
      };
      // Keep Sharp mobile/desktop variants from Admin upload — required for
      // public HeroSlideshow art-direction and correct public URLs.
      if (s.desktopImageUrl) slide.desktopImageUrl = s.desktopImageUrl;
      if (s.mobileImageUrl) slide.mobileImageUrl = s.mobileImageUrl;
      return slide;
    });
    const firstEnabled = saved.find((s) => s.enabled && s.src);
    return {
      ...c,
      heroSlides: saved,
      hero: {
        ...c.hero,
        backgroundImage: firstEnabled?.src || c.hero.backgroundImage,
      },
    };
  });

  return jsonOk(saved);
}
