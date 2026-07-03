import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { revalidatePublicSite } from "@/lib/cms/revalidate-public";
import { readCMSContentFresh, updateCMSContent } from "@/lib/cms/store";
import {
  normalizeTestimonials,
  parseTestimonialInput,
} from "@/lib/cms/testimonials";
import { logCmsSync } from "@/lib/cms/sync-log";
import type { CMSTestimonial } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContentFresh();
  return jsonOk(content.testimonials);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid body");
  if (!String(body.quote ?? "").trim() || !String(body.author ?? "").trim()) {
    return jsonError("Quote and client name are required");
  }

  const content = await readCMSContentFresh();
  const sortOrder =
    typeof body.sortOrder === "number"
      ? body.sortOrder
      : content.testimonials.length;

  const item: CMSTestimonial = {
    ...parseTestimonialInput(body as Record<string, unknown>),
    id: createId("test"),
    sortOrder,
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    testimonials: [...c.testimonials, item],
  }));

  const created = updated.testimonials.find((t) => t.id === item.id) ?? item;
  revalidatePublicSite();
  return jsonOk(created, 201);
}

export async function PUT(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) return jsonError("Expected array of testimonials");

  const content = await readCMSContentFresh();
  const normalized = normalizeTestimonials(
    body as Partial<CMSTestimonial>[],
    content.testimonials
  );

  const updated = await updateCMSContent((c) => ({
    ...c,
    testimonials: normalized,
  }));

  logCmsSync("save", {
    route: "PUT /api/admin/testimonials",
    count: updated.testimonials.length,
    updatedAt: updated.updatedAt,
    firstAuthor: updated.testimonials[0]?.author,
  });

  revalidatePublicSite();
  return jsonOk(updated.testimonials);
}
