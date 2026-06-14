import { Container } from "@/components/ui/Container";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";
import { Logo } from "@/components/Logo";

const footerLinks = {
  company: [
    { label: "About", href: "#about" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Process", href: "#process" },
    { label: "Contact", isQuote: true as const },
  ],
  services: [
    { label: "Custom Logo Signs", href: "#services" },
    { label: "Wall Installations", href: "#services" },
    { label: "Event Signage", href: "#services" },
    { label: "Commercial Projects", href: "#services" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface pt-16 pb-8">
      <Container>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo href="/" variant="footer" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Premium custom LED neon signs crafted in Morocco, delivered
              worldwide. Transform your space with light.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
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
              {footerLinks.services.map((link) => (
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
              <li>Casablanca, Morocco</li>
              <li>
                <a
                  href="mailto:hello@neonbright.ma"
                  className="transition-colors hover:text-neon-pink"
                >
                  hello@neonbright.ma
                </a>
              </li>
              <li>
                <a
                  href="tel:+212600000000"
                  className="transition-colors hover:text-neon-pink"
                >
                  +212 600 000 000
                </a>
              </li>
              <li>
                <WhatsAppLink className="inline-flex items-center gap-2 text-[#25D366]">
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </WhatsAppLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Neon Bright. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Instagram", "LinkedIn", "Pinterest"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-xs text-muted transition-colors hover:text-white"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
