import { jsonOk } from "@/lib/cms/api";
import { getInstagramShowcase } from "@/lib/instagram/showcase";
import type { InstagramFeedResult } from "@/lib/instagram/types";

/** CMS-backed Instagram feed — must not be statically generated (reads Vercel Blob with no-store). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const showcase = await getInstagramShowcase();

  const payload: InstagramFeedResult = {
    posts: showcase.posts.map((post) => ({
      id: post.id,
      permalink: post.instagramUrl,
      imageUrl: post.image,
      alt: "",
      mediaType: "IMAGE",
      source: "cms",
      carouselItems: post.carouselImages?.length
        ? post.carouselImages.map((url, i) => ({
            id: `${post.id}-slide-${i}`,
            mediaType: "IMAGE",
            imageUrl: url,
          }))
        : undefined,
    })),
    source: "cms",
    configured: !showcase.isEmpty,
    profileUrl: showcase.profileUrl,
    settings: showcase.settings,
    isEmpty: showcase.isEmpty,
  };

  return jsonOk(payload);
}
