import { unstable_noStore as noStore } from "next/cache";
import { InstagramMarqueeShowcase } from "@/components/instagram/InstagramMarqueeShowcase";
import { getInstagramShowcase } from "@/lib/instagram/showcase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function InstagramFeedSection() {
  noStore();
  const data = await getInstagramShowcase();
  return <InstagramMarqueeShowcase data={data} />;
}
