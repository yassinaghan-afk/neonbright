"use client";

import { motion } from "framer-motion";
import type { QuoteFormData, QuoteFormErrors } from "@/lib/quote/types";
import { FormField } from "@/components/quote/FormFields";
import { FileUpload } from "@/components/quote/FileUpload";

type UploadStepProps = {
  data: QuoteFormData;
  errors: QuoteFormErrors;
  onChange: (field: keyof QuoteFormData, value: File | null) => void;
};

export function UploadStep({ data, errors, onChange }: UploadStepProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm leading-relaxed text-muted">
        Upload your logo or design file so our team can prepare an accurate
        photorealistic mockup. Supported formats: PNG, JPG, SVG, PDF.
      </p>
      <FormField
        label="Logo or Design File"
        htmlFor="file"
        hint="Optional — you can skip and send files later"
        error={errors.file}
      >
        <FileUpload
          file={data.file}
          onChange={(file) => onChange("file", file)}
          error={errors.file}
        />
      </FormField>
    </motion.div>
  );
}
