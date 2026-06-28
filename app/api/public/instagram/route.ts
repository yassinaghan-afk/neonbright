import { jsonOk } from "@/lib/cms/api";
import { getInstagramFeed } from "@/lib/instagram/posts";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram/constants";
import { isInstagramApiConfigured } from "@/lib/instagram/config";

/** Instagram feed from Graph API only — revalidates hourly */
export const revalidate = 3600;

export async function GET() {
  const feed = await getInstagramFeed();
  return jsonOk({
    ...feed,
    profileUrl: INSTAGRAM_PROFILE_URL,
    configured: isInstagramApiConfigured(),
    cachedSeconds: 3600,
  });
}
