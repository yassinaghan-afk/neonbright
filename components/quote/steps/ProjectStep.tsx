"use client";

import { motion } from "framer-motion";
import { PROJECT_TYPES } from "@/lib/quote/constants";
import type { QuoteFormData, QuoteFormErrors } from "@/lib/quote/types";
import {
  FormField,
  FormInput,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
} from "@/components/quote/FormFields";

type ProjectStepProps = {
  data: QuoteFormData;
  errors: QuoteFormErrors;
  onChange: (field: keyof QuoteFormData, value: string | boolean) => void;
};

export function ProjectStep({ data, errors, onChange }: ProjectStepProps) {
  return (
    <motion.div
      key="project"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <FormField
        label="Project Type"
        htmlFor="projectType"
        required
        error={errors.projectType}
      >
        <FormSelect
          id="projectType"
          name="projectType"
          value={data.projectType}
          error={!!errors.projectType}
          onChange={(e) => onChange("projectType", e.target.value)}
        >
          <option value="" disabled>
            Select project type
          </option>
          {PROJECT_TYPES.map((type) => (
            <option key={type.value} value={type.value} className="bg-surface">
              {type.label}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <div>
        <p className="mb-3 text-sm font-medium text-white/90">
          Dimensions <span className="text-neon-pink">*</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Width (cm)" htmlFor="width" error={errors.width}>
            <FormInput
              id="width"
              name="width"
              type="number"
              min="1"
              placeholder="e.g. 120"
              value={data.width}
              error={!!errors.width}
              onChange={(e) => onChange("width", e.target.value)}
            />
          </FormField>
          <FormField label="Height (cm)" htmlFor="height" error={errors.height}>
            <FormInput
              id="height"
              name="height"
              type="number"
              min="1"
              placeholder="e.g. 60"
              value={data.height}
              error={!!errors.height}
              onChange={(e) => onChange("height", e.target.value)}
            />
          </FormField>
        </div>
      </div>

      <FormField label="Environment" htmlFor="environment" required error={errors.environment}>
        <FormRadioGroup
          name="environment"
          value={data.environment}
          options={[
            { value: "indoor", label: "Indoor" },
            { value: "outdoor", label: "Outdoor" },
          ]}
          onChange={(v) => onChange("environment", v)}
          error={!!errors.environment}
        />
      </FormField>

      <FormField label="Color Option" htmlFor="colorType" required error={errors.colorType}>
        <FormRadioGroup
          name="colorType"
          value={data.colorType}
          options={[
            { value: "single-color", label: "Single Color" },
            { value: "rgb", label: "RGB Multi-Color" },
          ]}
          onChange={(v) => onChange("colorType", v)}
          error={!!errors.colorType}
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormCheckbox
          id="acrylicBacking"
          label="Acrylic Backing"
          checked={data.acrylicBacking}
          onChange={(v) => onChange("acrylicBacking", v)}
        />
        <FormCheckbox
          id="installationRequired"
          label="Installation Required"
          checked={data.installationRequired}
          onChange={(v) => onChange("installationRequired", v)}
        />
      </div>
    </motion.div>
  );
}
