import { requireOwner, jsonOk } from "@/lib/cms/api";
import { readCMSContent } from "@/lib/cms/store";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  const content = await readCMSContent();
  return jsonOk(content);
}
