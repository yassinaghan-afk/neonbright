import { Suspense } from "react";
import AdminLeadsPage from "./LeadsClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-white/45">Loading leads...</div>}>
      <AdminLeadsPage />
    </Suspense>
  );
}
