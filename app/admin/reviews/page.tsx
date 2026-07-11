"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewsManager } from "@/components/admin/ReviewsManager";

export default function AdminReviewsPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Avis Clients</h1>
        <p className="mt-1 text-sm text-white/45">
          Gérez les captures d&apos;écran d&apos;avis affichées dans la section
          défilante de la page d&apos;accueil.
        </p>
      </div>
      <ReviewsManager />
    </AdminShell>
  );
}
