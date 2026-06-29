import { InstagramMarqueeShowcase } from "@/components/instagram/InstagramMarqueeShowcase";
import { getInstagramShowcase } from "@/lib/instagram/showcase";

export async function InstagramFeedSection() {
  const data = await getInstagramShowcase();
  return <InstagramMarqueeShowcase data={data} />;
}
