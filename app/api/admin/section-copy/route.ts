import { NextRequest } from "next/server";
import { jsonOk, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content.sectionCopy);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    sectionCopy: {
      ...c.sectionCopy,
      ...body,
      portfolio: body.portfolio
        ? { ...c.sectionCopy.portfolio, ...body.portfolio }
        : c.sectionCopy.portfolio,
      services: body.services
        ? { ...c.sectionCopy.services, ...body.services }
        : c.sectionCopy.services,
      industries: body.industries
        ? { ...c.sectionCopy.industries, ...body.industries }
        : c.sectionCopy.industries,
      testimonials: body.testimonials
        ? { ...c.sectionCopy.testimonials, ...body.testimonials }
        : c.sectionCopy.testimonials,
      process: body.process
        ? { ...c.sectionCopy.process, ...body.process }
        : c.sectionCopy.process,
      faq: body.faq
        ? { ...c.sectionCopy.faq, ...body.faq }
        : c.sectionCopy.faq,
      cta: body.cta
        ? { ...c.sectionCopy.cta, ...body.cta }
        : c.sectionCopy.cta,
    },
  }));

  return jsonOk(updated.sectionCopy);
}
