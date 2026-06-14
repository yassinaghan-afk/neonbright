import { Suspense } from "react";
import AdminDashboardClient from "./DashboardClient";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/45">Loading dashboard...</div>}>
      <AdminDashboardClient />
    </Suspense>
  );
}
