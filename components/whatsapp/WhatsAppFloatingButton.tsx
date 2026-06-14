"use client";

import { motion } from "framer-motion";
import {
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_GREETING,
  WHATSAPP_NUMBER,
} from "@/lib/whatsapp/config";
import { WhatsAppIcon } from "./WhatsAppLink";

export function WhatsAppFloatingButton() {
  const href = buildWhatsAppUrl(WHATSAPP_NUMBER, DEFAULT_WHATSAPP_GREETING);

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.45)] sm:bottom-8 sm:right-8"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </motion.a>
  );
}
