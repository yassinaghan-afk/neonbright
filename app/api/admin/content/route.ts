import { requireOwner, jsonOk, jsonErrorFromUnknown } from "@/lib/cms/api";
import { readCMSContent } from "@/lib/cms/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireOwner();
    if (error) return error;
    const content = await readCMSContent();
    return jsonOk(content);
  } catch (err) {
    return jsonErrorFromUnknown(err);
  }
}
