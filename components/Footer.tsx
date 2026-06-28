import { Container } from "@/components/ui/Container";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";
import { Logo } from "@/components/Logo";
import type { CompanyInfo, ContactInfo, SocialLinks } from "@/lib/cms/types";

const staticFooterLinks = {
  company: [
    { label: "À propos", href: "#about" },
    { label: "Réalisations", href: "#portfolio" },
    { label: "Processus", href: "#process" },
    { label: "Contact", isQuote: true as const },
  ],
  services: [
    { label: "Néons LED personnalisés", href: "#services" },
    { label: "Enseignes lumineuses", href: "#services" },
    { label: "Logos lumineux", href: "#services" },
    { label: "Signalétique professionnelle", href: "#services" },
  ],
};

type FooterProps = {
  company?: CompanyInfo;
  contact?: ContactInfo;
  social?: SocialLinks;
};

export function Footer({ company, contact, social }: FooterProps) {
  const tagline =
    company?.footerTagline ??
    "Néon LED et enseignes lumineuses sur mesure, fabriqués au Maroc et livrés dans le monde entier. Illuminez votre marque avec excellence.";

  const address = contact?.address ?? "Casablanca, Maroc";
  const email = contact?.email ?? "hello@neonbright.ma";
  const phone = contact?.phone ?? "+212 600 000 000";
  const year = new Date().getFullYear();
  const companyName = company?.name ?? "Neon Bright";

  const socialLinks = [
    { label: "Instagram", href: social?.instagram || "#" },
    { label: "LinkedIn", href: social?.linkedin || "#" },
    { label: "Pinterest", href: social?.pinterest || "#" },
  ];

  return (
    <footer className="border-t border-white/10 bg-surface pt-16 pb-8">
      <Container>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo href="/" variant="footer" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {tagline}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Entreprise
            </h4>
            <ul className="mt-4 space-y-3">
              {staticFooterLinks.company.map((link) => (
                <li key={link.label}>
                  {"isQuote" in link && link.isQuote ? (
                    <QuoteLink className="text-sm text-muted transition-colors hover:text-white">
                      {link.label}
                    </QuoteLink>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Services
            </h4>
            <ul className="mt-4 space-y-3">
              {staticFooterLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>{address}</li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-neon-pink"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-neon-pink"
                >
                  {phone}
                </a>
              </li>
              <li>
                <WhatsAppLink className="inline-flex items-center gap-2 text-[#25D366]">
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </WhatsAppLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {year} {companyName}. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-xs text-muted transition-colors hover:text-white"
                target={s.href !== "#" ? "_blank" : undefined}
                rel={s.href !== "#" ? "noopener noreferrer" : undefined}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
