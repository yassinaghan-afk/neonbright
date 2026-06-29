import { getSession } from "@/lib/cms/auth";
import { jsonErrorFromUnknown, jsonOk } from "@/lib/cms/api";
import { getPortfolioApiPayload } from "@/lib/cms/portfolio";

export const dynamic = "force-dynamic";

/** Public portfolio read API — same data source as the website and admin list. */
export async function GET() {
  try {
    const session = await getSession();
    const includeHidden = session?.role === "owner";
    const payload = await getPortfolioApiPayload({ includeHidden });
    return jsonOk(payload);
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
