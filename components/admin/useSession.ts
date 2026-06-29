"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/auth/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";

export type AdminSession = {
  email: string;
  role: UserRole;
  name: string;
};

export function useSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then(async (r) => {
        const data = await parseJsonResponse(r);
        if (
          r.ok &&
          typeof data.email === "string" &&
          (data.role === "owner" || data.role === "staff")
        ) {
          setSession({
            email: data.email,
            role: data.role as UserRole,
            name: typeof data.name === "string" ? data.name : data.email,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { session, loading, isOwner: session?.role === "owner" };
}
