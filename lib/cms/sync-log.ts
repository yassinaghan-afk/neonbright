/** Tracing for Admin → Storage → Public API → Website (always enabled). */
export function logCmsSync(
  stage: "save" | "storage-updated" | "storage-read" | "public-api" | "website-render" | "delete",
  detail?: Record<string, unknown>
) {
  const payload = detail ? ` ${JSON.stringify(detail)}` : "";
  console.log(`[cms-sync] ${stage}${payload}`);
}
