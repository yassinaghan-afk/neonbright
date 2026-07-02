"use client";

import { createContext, useContext, useMemo } from "react";
import type { ContactInfo, SocialLinks } from "@/lib/cms/types";
import {
  resolveSocialContactSettings,
  buildWhatsAppUrl,
  resolveWhatsAppNumber,
  type SocialContactSettings,
} from "@/lib/cms/contact-social";
import { DEFAULT_WHATSAPP_GREETING } from "@/lib/whatsapp/config";

export type ContactSocialContextValue = SocialContactSettings & {
  whatsAppUrlWithGreeting: string;
};

const ContactSocialContext = createContext<ContactSocialContextValue | null>(
  null
);

type Props = {
  contact: ContactInfo;
  social: SocialLinks;
  instagramSettingsUrl?: string;
  children: React.ReactNode;
};

export function ContactSocialProvider({
  contact,
  social,
  instagramSettingsUrl,
  children,
}: Props) {
  const value = useMemo<ContactSocialContextValue>(() => {
    const resolved = resolveSocialContactSettings(
      contact,
      social,
      instagramSettingsUrl
    );
    const whatsappNumber = resolveWhatsAppNumber(contact);
    return {
      ...resolved,
      whatsAppUrlWithGreeting: buildWhatsAppUrl(
        whatsappNumber,
        DEFAULT_WHATSAPP_GREETING
      ),
    };
  }, [contact, social, instagramSettingsUrl]);

  return (
    <ContactSocialContext.Provider value={value}>
      {children}
    </ContactSocialContext.Provider>
  );
}

export function useContactSocial(): ContactSocialContextValue {
  const ctx = useContext(ContactSocialContext);
  if (!ctx) {
    throw new Error(
      "useContactSocial must be used within ContactSocialProvider"
    );
  }
  return ctx;
}

/** Safe variant — returns null when provider is absent (e.g. admin pages). */
export function useContactSocialOptional(): ContactSocialContextValue | null {
  return useContext(ContactSocialContext);
}
