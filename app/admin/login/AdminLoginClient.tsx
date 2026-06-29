"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAlert, AdminButton, AdminField, AdminInput } from "@/components/admin/ui/AdminForm";
import { Logo } from "@/components/Logo";
import { parseJsonResponse } from "@/lib/http/parse-json-response";

export default function AdminLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : "Login failed"
        );
      }

      const from = searchParams.get("from");
      const role = typeof data.role === "string" ? data.role : "owner";
      const defaultPath = role === "staff" ? "/admin/leads" : "/admin";
      router.push(from ?? defaultPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] p-8">
        <div className="mb-8 flex flex-col items-center">
          <Logo href="/" variant="display" />
          <p className="mt-3 text-sm text-white/45">Admin Sign In</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && <AdminAlert type="error" message={error} />}
          <AdminField label="Email" htmlFor="email" required>
            <AdminInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </AdminField>
          <AdminField label="Password" htmlFor="password" required>
            <AdminInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </AdminField>
          <AdminButton type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
