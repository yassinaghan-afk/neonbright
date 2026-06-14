import { Suspense } from "react";
import AdminLoginClient from "./AdminLoginClient";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white/45">
          Loading...
        </div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  );
}
