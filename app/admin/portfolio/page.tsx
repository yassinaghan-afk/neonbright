import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCard } from "@/components/admin/ui/AdminForm";

export default function AdminPortfolioHubPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Portfolio</h1>
        <p className="mt-1 text-sm text-white/45">
          Gérez les réalisations Events et Brands dans des sections séparées.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/portfolio/events">
          <AdminCard title="Events">
            <p className="text-sm text-white/55">
              Catégories et projets événementiels — alimente /realisations/events
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neon-pink">
              Ouvrir Events →
            </p>
          </AdminCard>
        </Link>
        <Link href="/admin/portfolio/brands">
          <AdminCard title="Brands">
            <p className="text-sm text-white/55">
              Catégories et projets marques — alimente /realisations/brands
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-neon-pink">
              Ouvrir Brands →
            </p>
          </AdminCard>
        </Link>
      </div>
    </AdminShell>
  );
}
