import { Container } from "@/components/ui/Container";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";
import { SocialIconLinks } from "@/components/contact/SocialIconLinks";
import { Logo } from "@/components/Logo";
import { readCMSContent } from "@/lib/cms/store";
import { buildWhatsAppBaseUrl } from "@/lib/cms/contact-social";
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

type FooterContentProps = {
  company: CompanyInfo;
  contact: ContactInfo;
  social: SocialLinks;
};

function FooterContent({ company, contact, social }: FooterContentProps) {
  const tagline = company.footerTagline ?? company.description;
  const year = new Date().getFullYear();
  const whatsAppHref = buildWhatsAppBaseUrl(
    contact.whatsapp?.trim() || contact.phone?.trim() || ""
  );

  const socialLinks = [
    social.instagram?.trim()
      ? { label: "Instagram", href: social.instagram.trim() }
      : null,
    social.facebook?.trim()
      ? { label: "Facebook", href: social.facebook.trim() }
      : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="border-t border-white/10 bg-surface pt-16 pb-8">
      <Container>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo href="/" variant="footer" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {tagline}
            </p>
            <SocialIconLinks
              className="mt-5"
              instagramUrl={social.instagram}
              facebookUrl={social.facebook}
            />
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
              {contact.address ? (
                <li>
                  {contact.googleMapsUrl ? (
                    <a
                      href={contact.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-neon-pink"
                    >
                      {contact.address}
                    </a>
                  ) : (
                    contact.address
                  )}
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors hover:text-neon-pink"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="transition-colors hover:text-neon-pink"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {whatsAppHref ? (
                <li>
                  <WhatsAppLink
                    href={whatsAppHref}
                    className="inline-flex items-center gap-2 text-[#25D366]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </WhatsAppLink>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {year} {company.name}. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-xs text-muted transition-colors hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
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

/** Footer reads contact & social from CMS on every request. */
export async function Footer() {
  const { company, contact, social } = await readCMSContent();
  return (
    <FooterContent company={company} contact={contact} social={social} />
  );
}
