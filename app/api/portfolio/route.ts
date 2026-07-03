import { NextResponse } from "next/server";
import { getSession } from "@/lib/cms/auth";
import { jsonErrorFromUnknown } from "@/lib/cms/api";
import { getPortfolioApiPayload } from "@/lib/cms/portfolio";

export const dynamic = "force-dynamic";

/** Public portfolio read API — same data source as the website and admin list. */
export async function GET() {
  try {
    const session = await getSession();
    const includeHidden = session?.role === "owner";
    const payload = await getPortfolioApiPayload({ includeHidden });

    console.log(
      `[cms-sync] api/portfolio: ${payload.projects.length} projects (includeHidden=${includeHidden})`,
      payload.projects.map((p) => `${p.id.slice(-6)}:${p.published ? "pub" : "hid"}`).join(",")
    );

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
