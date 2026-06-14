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
  return { data: json as T };
}
