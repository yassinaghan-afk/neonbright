"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/auth/types";

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
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.email && data?.role) {
          setSession({
            email: data.email,
            role: data.role,
            name: data.name ?? data.email,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { session, loading, isOwner: session?.role === "owner" };
}
