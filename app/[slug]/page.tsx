import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SeoJsonLd } from "@/components/seo/SeoJsonLd";
import { SeoLandingTemplate } from "@/components/seo/SeoLandingTemplate";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { hydrateSeoRegistry } from "@/lib/seo/registry";
import { getAllSeoSlugs, getRelatedPages, resolveSeoPage } from "@/lib/seo/resolver";
import { buildPageJsonLd } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const registry = await hydrateSeoRegistry();
  return getAllSeoSlugs(registry).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const registry = await hydrateSeoRegistry();
  const page = resolveSeoPage(slug, registry);
  if (!page) return { title: "Not Found" };
  return buildPageMetadata(page);
}

export default async function SeoLandingPage({ params }: Props) {
  const { slug } = await params;
  const registry = await hydrateSeoRegistry();
  const page = resolveSeoPage(slug, registry);

  if (!page) notFound();

  const related = getRelatedPages(page, registry);
  const jsonLd = buildPageJsonLd(page);

  return (
    <>
      <SeoJsonLd data={jsonLd} />
      <Navbar />
      <main>
        <SeoLandingTemplate page={page} related={related} />
      </main>
      <Footer />
    </>
  );
}
