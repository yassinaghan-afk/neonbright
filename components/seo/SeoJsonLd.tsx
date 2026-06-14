import Link from "next/link";
import type { SeoPage } from "@/lib/seo/types";

export function SeoJsonLd({ data }: { data: Record<string, unknown>[] }) {
  return (
    <>
      {data.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

export function SeoBreadcrumbs({ page }: { page: SeoPage }) {
  const crumbs: { label: string; href: string }[] = [{ label: "Home", href: "/" }];

  if (page.service) {
    crumbs.push({ label: page.service.name, href: `/${page.service.slug}` });
  } else if (page.industry) {
    crumbs.push({
      label: page.industry.pluralName ?? page.industry.name,
      href: `/${page.industry.slug}`,
    });
  }

  if (page.city && page.type !== "city") {
    crumbs.push({ label: page.city.name, href: `/${page.city.slug}` });
  }

  if (page.type === "service-city" || page.type === "industry-city") {
    crumbs.push({ label: page.headline, href: page.canonicalPath });
  } else if (crumbs[crumbs.length - 1]?.href !== page.canonicalPath) {
    crumbs.push({ label: page.headline, href: page.canonicalPath });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/45">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-white/70">{c.label}</span>
            ) : (
              <Link href={c.href} className="transition-colors hover:text-neon-pink">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
