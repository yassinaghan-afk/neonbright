"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useDraftEditor<T>(fetchUrl: string) {
  const [saved, setSaved] = useState<T[]>([]);
  const [draft, setDraft] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dirty = useMemo(
    () => JSON.stringify(saved) !== JSON.stringify(draft),
    [saved, draft]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Échec du chargement");
      const data = (await res.json()) as T[];
      setSaved(data);
      setDraft(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const cancel = useCallback(() => {
    setDraft(saved);
    setSuccess("");
    setError("");
  }, [saved]);

  const commit = useCallback(
    async (saveUrl: string, body: unknown) => {
      setSaving(true);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(saveUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Échec de l'enregistrement");
        const data = json as T[];
        setSaved(data);
        setDraft(data);
        setSuccess("Modifications enregistrées");
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    saved,
    draft,
    setDraft,
    dirty,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    load,
    cancel,
    commit,
  };
}

export async function uploadMediaFiles(
  files: File[],
  preset: "hero" | "logo" | "gallery"
): Promise<{ url: string; filename: string; label: string }[]> {
  const { uploadAdminFiles } = await import("@/lib/admin/upload-client");
  const results = await uploadAdminFiles(files, preset);
  return results.map(({ url, filename, label }) => ({ url, filename, label }));
}
