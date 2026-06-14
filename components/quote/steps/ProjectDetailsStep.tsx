"use client";

import { motion } from "framer-motion";
import { BUDGET_RANGES } from "@/lib/quote/constants";
import type { QuoteFormData, QuoteFormErrors } from "@/lib/quote/types";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/quote/FormFields";

type ProjectDetailsStepProps = {
  data: QuoteFormData;
  errors: QuoteFormErrors;
  onChange: (field: keyof QuoteFormData, value: string) => void;
};

export function ProjectDetailsStep({
  data,
  errors,
  onChange,
}: ProjectDetailsStepProps) {
  return (
    <motion.div
      key="project-details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <FormField
        label="Budget Range"
        htmlFor="budgetRange"
        required
        error={errors.budgetRange}
      >
        <FormSelect
          id="budgetRange"
          name="budgetRange"
          value={data.budgetRange}
          error={!!errors.budgetRange}
          onChange={(e) => onChange("budgetRange", e.target.value)}
        >
          <option value="" disabled>
            Select your budget range
          </option>
          {BUDGET_RANGES.map((range) => (
            <option key={range.value} value={range.value} className="bg-surface">
              {range.label}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <FormField
        label="Estimated Price"
        htmlFor="estimatedPrice"
        hint="Optional — your expected budget or target price"
      >
        <FormInput
          id="estimatedPrice"
          name="estimatedPrice"
          type="text"
          placeholder="e.g. $2,500 or €1,800"
          value={data.estimatedPrice}
          onChange={(e) => onChange("estimatedPrice", e.target.value)}
        />
      </FormField>

      <FormField
        label="Project Message"
        htmlFor="message"
        hint="Timeline, placement, colors, or special requirements"
      >
        <FormTextarea
          id="message"
          name="message"
          placeholder="Tell us about your project vision, deadline, or installation location..."
          value={data.message}
          onChange={(e) => onChange("message", e.target.value)}
        />
      </FormField>
    </motion.div>
  );
}
