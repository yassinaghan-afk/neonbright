import { NextRequest } from "next/server";
import { jsonOk, requireOwner } from "@/lib/cms/api";
import { readCMSContent, updateCMSContent } from "@/lib/cms/store";
import type { CMSInstagramSettings } from "@/lib/cms/types";

function normalizeSettings(
  body: Partial<CMSInstagramSettings>,
  current: CMSInstagramSettings
): CMSInstagramSettings {
  return {
    enabled: body.enabled ?? current.enabled,
    title: String(body.title ?? current.title).trim(),
    subtitle: String(body.subtitle ?? current.subtitle).trim(),
    buttonText: String(body.buttonText ?? current.buttonText).trim(),
    url: String(body.url ?? current.url).trim(),
  };
}

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const content = await readCMSContent();
  return jsonOk({
    ...content.instagram,
    stats: {
      postsCount: (content.instagramPosts ?? []).length,
      reelsCount: (content.instagramReels ?? []).length,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => ({}));

  const updated = await updateCMSContent((c) => ({
    ...c,
    instagram: normalizeSettings(body, c.instagram),
  }));

  const content = await readCMSContent();

  return jsonOk({
    ...updated.instagram,
    stats: {
      postsCount: (content.instagramPosts ?? []).length,
      reelsCount: (content.instagramReels ?? []).length,
    },
  });
}
