import { jsonOk, jsonErrorFromUnknown } from "@/lib/cms/api";
import { getPublicHomepageContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getPublicHomepageContent();
    return jsonOk(content);
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
