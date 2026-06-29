"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks as staticNavLinks } from "@/lib/data";
import { cn } from "@/lib/utils";
import { QuoteTrigger } from "@/components/quote/QuoteTrigger";
import { useQuote } from "@/components/quote/QuoteProvider";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/Logo";
import { SocialIconLinks } from "@/components/contact/SocialIconLinks";
import { WhatsAppLink, WhatsAppIcon } from "@/components/whatsapp/WhatsAppLink";
import type { CMSNavLink } from "@/lib/cms/types";

type NavbarProps = {
  nav?: CMSNavLink[];
};

export function Navbar({ nav }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openQuote } = useQuote();

  const navLinks = nav ?? staticNavLinks.map((l, i) => ({
    id: String(i),
    label: l.label,
    href: l.href,
    sortOrder: i,
    enabled: true,
  }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNavClick = (label: string) => {
    if (label === "Contact") {
      openQuote(1);
      setMobileOpen(false);
      return true;
    }
    return false;
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "glass py-3" : "bg-transparent py-5"
        )}
      >
        <Container className="flex items-center justify-between gap-4">
          <Logo href="/" variant="nav" className="shrink-0" />

          <nav className="hidden items-center gap-8 lg:flex lg:ml-10 xl:ml-14">
            {navLinks.map((link) =>
              link.label === "Contact" ? (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => openQuote(1)}
                  className="text-sm text-muted transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-sm text-muted transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <SocialIconLinks iconClassName="h-4 w-4" />
            <WhatsAppLink
              variant="inline"
              className="inline-flex items-center gap-1.5 text-sm text-[#25D366]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">WhatsApp</span>
            </WhatsAppLink>
            <QuoteTrigger size="sm" className="glow-cta">
              Obtenir un Devis
            </QuoteTrigger>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-white transition-colors"
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block h-0.5 w-6 bg-white transition-colors"
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 w-6 bg-white transition-colors"
            />
          </button>
        </Container>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 glass lg:hidden"
          >
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="flex h-full flex-col items-center justify-center gap-8"
            >
              <Logo
                href="/"
                variant="menu"
                onClick={() => setMobileOpen(false)}
                className="mb-6"
              />
              {navLinks.map((link, i) =>
                link.label === "Contact" ? (
                  <motion.button
                    key={link.id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="font-display text-2xl font-medium text-white"
                    onClick={() => handleNavClick(link.label)}
                  >
                    {link.label}
                  </motion.button>
                ) : (
                  <motion.a
                    key={link.id}
                    href={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="font-display text-2xl font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </motion.a>
                )
              )}
              <QuoteTrigger onTrigger={() => setMobileOpen(false)}>
                Obtenir un Devis
              </QuoteTrigger>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + navLinks.length * 0.05 }}
                className="mt-4 flex flex-col items-center gap-5"
              >
                <SocialIconLinks iconClassName="h-6 w-6" />
                <WhatsAppLink
                  variant="button"
                  className="min-w-[200px]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  WhatsApp
                </WhatsAppLink>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
