import { NextResponse } from "next/server";
import { jsonOk, jsonErrorFromUnknown } from "@/lib/cms/api";
import { getPublicHomepageContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Fresh Blob read — this route is force-dynamic and must never serve a
    // stale unstable_cache CMS snapshot after an admin write.
    const content = await getPublicHomepageContent({ fresh: true });
    const res = jsonOk(content);
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
