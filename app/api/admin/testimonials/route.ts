import { requireOwner, jsonError, jsonOk } from "@/lib/cms/api";
import { createId } from "@/lib/cms/id";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSTestimonial } from "@/lib/cms/types";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.testimonials);
}

export async function POST(request: Request) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.quote || !body?.author) return jsonError("Quote and author are required");

  const item: CMSTestimonial = {
    id: createId("test"),
    quote: body.quote,
    author: body.author,
    role: body.role ?? "",
    location: body.location ?? "",
  };

  await updateCMSContent((c) => ({
    ...c,
    testimonials: [...c.testimonials, item],
  }));

  return jsonOk(item, 201);
}
