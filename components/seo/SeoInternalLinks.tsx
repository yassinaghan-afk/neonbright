import Link from "next/link";
import type { SeoPage } from "@/lib/seo/types";

export function SeoInternalLinks({
  related,
  title = "Related Pages",
}: {
  related: SeoPage[];
  title?: string;
}) {
  if (related.length === 0) return null;

  return (
    <section className="border-t border-white/10 pt-12">
      <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-white/45">
        Explore more neon signage solutions across Morocco
      </p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => (
          <li key={p.slug}>
            <Link
              href={p.canonicalPath}
              className="block rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70 transition-colors hover:border-neon-pink/30 hover:text-neon-pink"
            >
              {p.headline}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
