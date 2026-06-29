"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
} from "@/components/admin/ui/AdminForm";
import { adminFetch } from "@/components/admin/useCMS";
import { buildWhatsAppBaseUrl } from "@/lib/cms/contact-social";
import type { ContactInfo, SocialLinks } from "@/lib/cms/types";

const EMPTY_CONTACT: ContactInfo = {
  address: "",
  email: "",
  phone: "",
  whatsapp: "",
  googleMapsUrl: "",
};

const EMPTY_SOCIAL: SocialLinks = {
  instagram: "",
  facebook: "",
  linkedin: "",
  pinterest: "",
  twitter: "",
};

export default function AdminSocialContactPage() {
  const [contact, setContact] = useState<ContactInfo>(EMPTY_CONTACT);
  const [social, setSocial] = useState<SocialLinks>(EMPTY_SOCIAL);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/social-contact")
      .then((r) => r.json())
      .then((res) => {
        if (res.contact) {
          setContact(res.contact);
          setSocial(res.social);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const whatsAppLink = useMemo(
    () => buildWhatsAppBaseUrl(contact.whatsapp || contact.phone),
    [contact.whatsapp, contact.phone]
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const { error } = await adminFetch("/api/admin/settings/social-contact", {
      method: "PATCH",
      body: JSON.stringify({ contact, social }),
    });
    setSaving(false);
    setMsg(
      error
        ? { type: "error", text: error }
        : { type: "success", text: "Saved — changes are live on the website." }
    );
  };

  if (!loaded) {
    return (
      <AdminShell>
        <p className="text-white/45">Loading...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
          Settings
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">Social &amp; Contact</h1>
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </AdminButton>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Manage WhatsApp, social profiles, and contact details shown across the
          website — navigation, footer, contact sections, and the floating
          WhatsApp button.
        </p>
      </div>

      {msg && (
        <div className="mb-4">
          <AdminAlert type={msg.type} message={msg.text} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="WhatsApp">
          <div className="space-y-3">
            <AdminField label="WhatsApp Number" required>
              <AdminInput
                value={contact.whatsapp ?? ""}
                onChange={(e) =>
                  setContact({ ...contact, whatsapp: e.target.value })
                }
                placeholder="+212702688416"
              />
            </AdminField>
            <AdminField
              label="WhatsApp Link"
              hint="Auto-generated from the number above"
            >
              <AdminInput
                value={whatsAppLink}
                readOnly
                className="text-white/50"
              />
            </AdminField>
          </div>
        </AdminCard>

        <AdminCard title="Social Media" description="Full URLs including https://">
          <div className="space-y-3">
            <AdminField label="Instagram URL" required>
              <AdminInput
                value={social.instagram}
                onChange={(e) =>
                  setSocial({ ...social, instagram: e.target.value })
                }
                placeholder="https://www.instagram.com/..."
              />
            </AdminField>
            <AdminField label="Facebook URL" required>
              <AdminInput
                value={social.facebook}
                onChange={(e) =>
                  setSocial({ ...social, facebook: e.target.value })
                }
                placeholder="https://www.facebook.com/..."
              />
            </AdminField>
          </div>
        </AdminCard>

        <AdminCard title="Contact Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Email" required>
              <AdminInput
                type="email"
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
                placeholder="hello@neonbright.ma"
              />
            </AdminField>
            <AdminField label="Phone (display)">
              <AdminInput
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
                placeholder="+212 702 688 416"
              />
            </AdminField>
            <AdminField label="Address (optional)">
              <AdminInput
                value={contact.address}
                onChange={(e) =>
                  setContact({ ...contact, address: e.target.value })
                }
                placeholder="Casablanca, Maroc"
              />
            </AdminField>
            <AdminField label="Google Maps URL (optional)">
              <AdminInput
                value={contact.googleMapsUrl ?? ""}
                onChange={(e) =>
                  setContact({ ...contact, googleMapsUrl: e.target.value })
                }
                placeholder="https://maps.google.com/..."
              />
            </AdminField>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
