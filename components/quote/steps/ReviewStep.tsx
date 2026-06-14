"use client";

import { motion } from "framer-motion";
import type { QuoteFormData } from "@/lib/quote/types";
import {
  BUDGET_RANGES,
  PROJECT_TYPES,
} from "@/lib/quote/constants";

type ReviewStepProps = {
  data: QuoteFormData;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="text-sm text-white/90 sm:text-right">{value}</span>
    </div>
  );
}

function labelFor(
  options: { value: string; label: string }[],
  value: string
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ReviewStep({ data }: ReviewStepProps) {
  const env = data.environment === "indoor" ? "Indoor" : data.environment === "outdoor" ? "Outdoor" : "";
  const color = data.colorType === "single-color" ? "Single Color" : data.colorType === "rgb" ? "RGB Multi-Color" : "";
  const options = [
    data.acrylicBacking && "Acrylic Backing",
    data.installationRequired && "Installation Required",
  ].filter(Boolean).join(", ") || "None";

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 sm:px-5">
        <p className="pt-4 text-xs font-semibold uppercase tracking-wider text-neon-pink">
          Product
        </p>
        <ReviewRow label="Type" value={labelFor(PROJECT_TYPES, data.projectType)} />
        <ReviewRow label="Dimensions" value={data.width && data.height ? `${data.width} × ${data.height} cm` : ""} />
        <ReviewRow label="Environment" value={env} />
        <ReviewRow label="Color" value={color} />
        <ReviewRow label="Options" value={options} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 sm:px-5">
        <p className="pt-4 text-xs font-semibold uppercase tracking-wider text-neon-purple">
          Upload & Details
        </p>
        <ReviewRow label="Logo File" value={data.file?.name ?? "No file uploaded"} />
        <ReviewRow label="Budget" value={labelFor(BUDGET_RANGES, data.budgetRange)} />
        <ReviewRow label="Estimated Price" value={data.estimatedPrice} />
        {data.message && (
          <div className="border-b border-white/5 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Message</span>
            <p className="mt-1 text-sm leading-relaxed text-white/80">{data.message}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 sm:px-5 pb-1">
        <p className="pt-4 text-xs font-semibold uppercase tracking-wider text-neon-blue">
          Contact
        </p>
        <ReviewRow label="Name" value={data.fullName} />
        <ReviewRow label="Email" value={data.email} />
        <ReviewRow label="Phone" value={data.phone} />
        <ReviewRow label="Company" value={data.companyName || "—"} />
        <ReviewRow label="Country" value={data.country} />
      </div>

      <p className="text-xs leading-relaxed text-muted/70">
        By submitting, you agree to be contacted by Neon Bright regarding your
        project. We respond within 24 hours with a detailed quote and mockup.
      </p>
    </motion.div>
  );
}
