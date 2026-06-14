"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuote } from "@/components/quote/QuoteProvider";
import {
  INITIAL_QUOTE_FORM,
  hasErrors,
  validateStep,
  validateAll,
} from "@/lib/quote";
import type { QuoteFormData, QuoteFormErrors, QuoteStep } from "@/lib/quote/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { QuoteProgress } from "@/components/quote/QuoteProgress";
import { QuoteSuccess } from "@/components/quote/QuoteSuccess";
import { ContactStep } from "@/components/quote/steps/ContactStep";
import { ProjectStep } from "@/components/quote/steps/ProjectStep";
import { UploadStep } from "@/components/quote/steps/UploadStep";
import { ProjectDetailsStep } from "@/components/quote/steps/ProjectDetailsStep";
import { ReviewStep } from "@/components/quote/steps/ReviewStep";

const STEP_TITLES: Record<QuoteStep, { title: string; subtitle: string }> = {
  1: {
    title: "Product Configuration",
    subtitle: "Tell us about your sign specifications",
  },
  2: {
    title: "Upload Your Logo",
    subtitle: "Share your logo or design file for an accurate mockup",
  },
  3: {
    title: "Project Details",
    subtitle: "Budget and additional project information",
  },
  4: {
    title: "Contact Information",
    subtitle: "How should we reach you with your quote?",
  },
  5: {
    title: "Review & Submit",
    subtitle: "Confirm your details before submitting",
  },
};

const LAST_STEP = 5 as QuoteStep;

type QuoteFormProps = {
  initialStep?: QuoteStep;
  onSuccess?: () => void;
};

export function QuoteForm({ initialStep = 1, onSuccess }: QuoteFormProps) {
  const { designerPayload, clearDesignerPayload } = useQuote();
  const [step, setStep] = useState<QuoteStep>(initialStep);
  const [data, setData] = useState<QuoteFormData>(() => ({
    ...INITIAL_QUOTE_FORM,
    projectType: designerPayload?.snapshot.signType === "logo" ? "custom-logo-neon" : INITIAL_QUOTE_FORM.projectType,
    message: designerPayload
      ? `Neon Preview Studio: ${designerPayload.snapshot.signType === "text" ? `"${designerPayload.snapshot.text}"` : "Logo sign"} · ${designerPayload.snapshot.sizePreset} · Color ${designerPayload.snapshot.color}`
      : "",
    estimatedPrice: designerPayload
      ? String(designerPayload.snapshot.estimatedPrice)
      : "",
    file: designerPayload?.logoFile ?? null,
  }));
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitReference, setSubmitReference] = useState("");
  const [submitWhatsappUrl, setSubmitWhatsappUrl] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateField = (
    field: keyof QuoteFormData,
    value: string | boolean | File | null
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const goNext = () => {
    const stepErrors = validateStep(step, data);
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < LAST_STEP) setStep((s) => (s + 1) as QuoteStep);
  };

  const goBack = () => {
    setErrors({});
    if (step > 1) setStep((s) => (s - 1) as QuoteStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validateAll(data);
    if (hasErrors(allErrors)) {
      setErrors(allErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("companyName", data.companyName);
    formData.append("country", data.country);
    formData.append("projectType", data.projectType);
    formData.append("width", data.width);
    formData.append("height", data.height);
    formData.append("environment", data.environment);
    formData.append("colorType", data.colorType);
    formData.append("acrylicBacking", String(data.acrylicBacking));
    formData.append("installationRequired", String(data.installationRequired));
    formData.append("budgetRange", data.budgetRange);
    formData.append("estimatedPrice", data.estimatedPrice);
    formData.append("message", data.message);
    if (data.file) formData.append("file", data.file);

    if (designerPayload) {
      formData.append("designerData", JSON.stringify(designerPayload.snapshot));
      formData.append("wallImage", designerPayload.wallImage);
      formData.append(
        "previewImage",
        designerPayload.previewBlob,
        "neon-preview.png"
      );
    }

    try {
      const res = await fetch("/api/quotes", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Submission failed");
      clearDesignerPayload();
      setSubmitReference(result.reference);
      setSubmitWhatsappUrl(result.whatsappUrl ?? "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    clearDesignerPayload();
    setData(INITIAL_QUOTE_FORM);
    setStep(1);
    setErrors({});
    setSubmitted(false);
    setSubmitReference("");
    setSubmitWhatsappUrl("");
    setSubmitError("");
  };

  if (submitted) {
    return (
      <QuoteSuccess
        reference={submitReference}
        whatsappUrl={submitWhatsappUrl}
        onReset={handleReset}
        onClose={onSuccess}
      />
    );
  }

  const { title, subtitle } = STEP_TITLES[step];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <QuoteProgress currentStep={step} />

      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold sm:text-xl">{title}</h3>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        {designerPayload && step === 4 && (
          <p className="mt-2 rounded-lg border border-neon-pink/20 bg-neon-pink/5 px-3 py-2 text-xs text-neon-pink">
            Your visual design preview will be attached to this quote.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <ProjectStep data={data} errors={errors} onChange={updateField} />
        )}
        {step === 2 && (
          <UploadStep data={data} errors={errors} onChange={updateField} />
        )}
        {step === 3 && (
          <ProjectDetailsStep data={data} errors={errors} onChange={updateField} />
        )}
        {step === 4 && (
          <ContactStep data={data} errors={errors} onChange={updateField} />
        )}
        {step === 5 && <ReviewStep data={data} />}
      </AnimatePresence>

      <div
        className={cn(
          "mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center",
          step === 1 ? "sm:justify-end" : "sm:justify-between"
        )}
      >
        {step > 1 && (
          <Button type="button" variant="ghost" onClick={goBack}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back
          </Button>
        )}

        {step < LAST_STEP ? (
          <Button type="button" onClick={goNext} className="sm:min-w-[160px]">
            Continue
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        ) : (
          <>
            {submitError && (
              <p className="mb-3 text-sm text-red-400">{submitError}</p>
            )}
            <Button type="submit" disabled={submitting} className="sm:min-w-[200px]">
              {submitting ? "Submitting..." : "Submit Quote Request"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
