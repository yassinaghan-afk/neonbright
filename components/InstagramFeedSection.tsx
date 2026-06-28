import { InstagramFeed } from "@/components/InstagramFeed";
import { getInstagramFeed } from "@/lib/instagram/posts";

export async function InstagramFeedSection() {
  const feed = await getInstagramFeed();
  return <InstagramFeed initialFeed={feed} />;
}
