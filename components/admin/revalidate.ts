"use client";

/** Call this after any CMS save to immediately refresh the public website. */
export async function revalidateSite(extraPaths?: string[]): Promise<void> {
  try {
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: extraPaths }),
    });
  } catch {
    // Non-fatal — UI already updated, background revalidation failed
  }
}
