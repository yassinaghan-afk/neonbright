"use client";

import { useCallback, useEffect, useState } from "react";
import type { CMSContent } from "@/lib/cms/types";

export function useCMSContent(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [content, setContent] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/content");
      if (!res.ok) throw new Error("Failed to load content");
      setContent(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { content, loading, error, refresh, setContent };
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function adminFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error ?? "Request failed" };

  const method = (options?.method ?? "GET").toUpperCase();
  if (MUTATING_METHODS.has(method)) {
    // Fire-and-forget revalidation so the public site refreshes immediately
    fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }

  return { data: json as T };
}
