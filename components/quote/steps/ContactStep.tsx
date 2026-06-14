"use client";

import { motion } from "framer-motion";
import { COUNTRIES } from "@/lib/quote/constants";
import type { QuoteFormData, QuoteFormErrors } from "@/lib/quote/types";
import {
  FormField,
  FormInput,
  FormSelect,
} from "@/components/quote/FormFields";

type ContactStepProps = {
  data: QuoteFormData;
  errors: QuoteFormErrors;
  onChange: (field: keyof QuoteFormData, value: string) => void;
};

export function ContactStep({ data, errors, onChange }: ContactStepProps) {
  return (
    <motion.div
      key="contact"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5 sm:grid-cols-2"
    >
      <FormField
        label="Full Name"
        htmlFor="fullName"
        required
        error={errors.fullName}
        className="sm:col-span-2"
      >
        <FormInput
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="John Smith"
          value={data.fullName}
          error={!!errors.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <FormInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="john@company.com"
          value={data.email}
          error={!!errors.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </FormField>

      <FormField label="Phone Number" htmlFor="phone" required error={errors.phone}>
        <FormInput
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+212 600 000 000"
          value={data.phone}
          error={!!errors.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </FormField>

      <FormField
        label="Company Name"
        htmlFor="companyName"
        hint="Optional — helps us tailor your quote"
      >
        <FormInput
          id="companyName"
          name="companyName"
          type="text"
          autoComplete="organization"
          placeholder="Your Company Ltd."
          value={data.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
        />
      </FormField>

      <FormField label="Country" htmlFor="country" required error={errors.country}>
        <FormSelect
          id="country"
          name="country"
          value={data.country}
          error={!!errors.country}
          onChange={(e) => onChange("country", e.target.value)}
        >
          <option value="" disabled>
            Select your country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-surface">
              {c}
            </option>
          ))}
        </FormSelect>
      </FormField>
    </motion.div>
  );
}
