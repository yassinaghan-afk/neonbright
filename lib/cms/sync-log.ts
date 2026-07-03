/** Development-only tracing for Admin → Storage → Public API → Website. */
export function logCmsSync(
  stage: "save" | "storage-updated" | "storage-read" | "public-api" | "website-render",
  detail?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "development") return;
  const payload = detail ? ` ${JSON.stringify(detail)}` : "";
  console.log(`[cms-sync] ${stage}${payload}`);
}
