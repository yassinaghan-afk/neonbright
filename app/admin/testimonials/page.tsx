"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";

export default function AdminTestimonialsPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Témoignages</h1>
        <p className="mt-1 text-sm text-white/45">
          Gérez les avis clients affichés dans la section « La confiance des grandes marques ».
        </p>
      </div>
      <TestimonialsManager />
    </AdminShell>
  );
}
