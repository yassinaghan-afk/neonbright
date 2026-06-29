import { NextRequest } from "next/server";
import { jsonOk, jsonError, jsonErrorFromUnknown, requireOwner } from "@/lib/cms/api";
import { getPortfolioApiPayload } from "@/lib/cms/portfolio";
import { updateCMSContent } from "@/lib/cms/store";
import { createId } from "@/lib/cms/id";
import type { CMSPortfolioCategory } from "@/lib/cms/types";

export async function GET() {
  try {
    const { error } = await requireOwner();
    if (error) return error;
    const { categories } = await getPortfolioApiPayload({ includeHidden: true });
    return jsonOk(categories);
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!body.title?.trim() || !body.slug?.trim()) {
    return jsonError("Title and slug are required.");
  }

  const item: CMSPortfolioCategory = {
    id: createId("cat"),
    slug: String(body.slug).trim(),
    title: String(body.title).trim(),
    titleAccent: String(body.titleAccent ?? "").trim(),
    description: String(body.description ?? "").trim(),
    coverImage: String(body.coverImage ?? ""),
    coverAlt: String(body.coverAlt ?? ""),
    heroImage: String(body.heroImage ?? body.coverImage ?? ""),
    href: String(body.href ?? `/realisations/${body.slug}`),
    pageTitle: String(body.pageTitle ?? body.titleAccent ?? body.title).trim(),
    pageSubtitle: String(body.pageSubtitle ?? "").trim(),
    enabled: body.enabled !== false,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Date.now(),
  };

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioCategories: [...(c.portfolioCategories ?? []), item],
  }));

  return jsonOk(item, 201);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body)) return jsonError("Expected array of categories.");

  const updated = await updateCMSContent((c) => ({
    ...c,
    portfolioCategories: body as CMSPortfolioCategory[],
  }));

  return jsonOk(updated.portfolioCategories);
}
