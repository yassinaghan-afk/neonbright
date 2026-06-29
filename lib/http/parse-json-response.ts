/** Parse fetch response bodies without throwing on empty or non-JSON payloads. */
export async function parseJsonResponse(
  response: Response
): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { data: parsed };
  } catch {
    return { message: text };
  }
}
