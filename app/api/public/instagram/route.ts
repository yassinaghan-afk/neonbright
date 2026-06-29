import { jsonOk } from "@/lib/cms/api";
import { readCMSContent } from "@/lib/cms/store";
import { resolveInstagramUrl } from "@/lib/cms/contact-social";
import { getInstagramFeed } from "@/lib/instagram/posts";
import { isInstagramApiConfigured } from "@/lib/instagram/config";

/** Instagram feed from Graph API only — revalidates hourly */
export const revalidate = 3600;

export async function GET() {
  const [feed, content] = await Promise.all([
    getInstagramFeed(),
    readCMSContent(),
  ]);
  const profileUrl = resolveInstagramUrl(content.social, content.instagram.url);

  return jsonOk({
    ...feed,
    profileUrl,
    configured: isInstagramApiConfigured(),
    cachedSeconds: 3600,
  });
}
