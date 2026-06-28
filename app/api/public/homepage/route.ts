import { jsonOk } from "@/lib/cms/api";
import { getPublicHomepageContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getPublicHomepageContent();
  return jsonOk(content);
}
