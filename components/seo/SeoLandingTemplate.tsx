import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { QuoteTrigger } from "@/components/quote/QuoteTrigger";
import { SeoBreadcrumbs } from "./SeoJsonLd";
import { SeoInternalLinks } from "./SeoInternalLinks";
import type { SeoPage } from "@/lib/seo/types";

const BENEFITS = [
  { title: "Custom Design", desc: "Every sign is designed to your brand, space, and vision." },
  { title: "Premium LED Neon", desc: "Energy-efficient, durable, and vivid — built to last." },
  { title: "Full Service", desc: "Design, fabrication, and professional installation." },
  { title: "24h Quote", desc: "Free photorealistic mockup and quote within 24 hours." },
];

function faqsFor(page: SeoPage) {
  const location = page.city?.name ?? "Morocco";
  const topic = page.service?.name ?? page.industry?.pluralName ?? "neon signs";
  return [
    {
      q: `How much do ${topic.toLowerCase()} cost in ${location}?`,
      a: `Pricing depends on size, complexity, and installation. We provide a detailed quote and free mockup within 24 hours.`,
    },
    {
      q: `Do you install ${topic.toLowerCase()} in ${location}?`,
      a: `Yes. Neon Bright designs, builds, and installs across ${location} and throughout Morocco.`,
    },
    {
      q: "How long does production take?",
      a: "Most projects are completed within 2–4 weeks from design approval, depending on scope.",
    },
  ];
}

export function SeoLandingTemplate({
  page,
  related,
}: {
  page: SeoPage;
  related: SeoPage[];
}) {
  const faqs = faqsFor(page);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-pink/5 via-transparent to-transparent" />
        <Container className="relative">
          <SeoBreadcrumbs page={page} />
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neon-pink">
            Neon Bright · Morocco
          </p>
          <h1 className="font-display max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {page.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            {page.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <QuoteTrigger size="lg">Get Free Quote</QuoteTrigger>
            <Link
              href="/designer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white"
            >
              Visualize on Your Wall
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <h3 className="font-display font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{b.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] py-16 sm:py-20">
        <Container>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Why Choose Neon Bright
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-white/60 sm:text-base">
            <p>
              Neon Bright is Morocco&apos;s premium LED neon studio, trusted by restaurants,
              hotels, retailers, and brands across the country
              {page.city ? ` — including ${page.city.name}` : ""}.
            </p>
            <p>
              {page.service
                ? `Our ${page.service.name.toLowerCase()} combine hand-finished craftsmanship with modern LED technology for a stunning, long-lasting result.`
                : page.industry
                  ? `We specialize in neon signage for ${page.industry.pluralName?.toLowerCase() ?? page.industry.name.toLowerCase()}, tailored to your brand identity and space.`
                  : "We deliver custom LED neon signs tailored to your brand, space, and budget."}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-medium text-white/90 marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/10 py-16 sm:py-20">
        <Container>
          <div className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Ready to Light Up {page.city?.name ?? "Your Space"}?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/55">
              Get a free mockup and commercial quote within 24 hours. No obligation.
            </p>
            <div className="mt-6 flex justify-center">
              <QuoteTrigger size="lg">Request Your Quote</QuoteTrigger>
            </div>
          </div>
          <div className="mt-16">
            <SeoInternalLinks related={related} />
          </div>
        </Container>
      </section>
    </>
  );
}
