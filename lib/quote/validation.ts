import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "./constants";
import type { QuoteFormData, QuoteFormErrors, QuoteStep } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFile(data: QuoteFormData): string | undefined {
  if (!data.file) return undefined;
  if (!ACCEPTED_FILE_TYPES.includes(data.file.type)) {
    return "Accepted formats: PNG, JPG, SVG, PDF";
  }
  if (data.file.size > MAX_FILE_SIZE_BYTES) {
    return "File must be under 10 MB";
  }
  return undefined;
}

export function validateStep(
  step: QuoteStep,
  data: QuoteFormData
): QuoteFormErrors {
  const errors: QuoteFormErrors = {};

  // Step 1 — Product configuration
  if (step === 1) {
    if (!data.projectType) errors.projectType = "Select a project type";
    if (!data.width.trim()) {
      errors.width = "Width is required";
    } else if (isNaN(Number(data.width)) || Number(data.width) <= 0) {
      errors.width = "Enter a valid width in cm";
    }
    if (!data.height.trim()) {
      errors.height = "Height is required";
    } else if (isNaN(Number(data.height)) || Number(data.height) <= 0) {
      errors.height = "Enter a valid height in cm";
    }
    if (!data.environment) errors.environment = "Select indoor or outdoor";
    if (!data.colorType) errors.colorType = "Select a color option";
  }

  // Step 2 — Upload logo (optional, validate if present)
  if (step === 2) {
    const fileError = validateFile(data);
    if (fileError) errors.file = fileError;
  }

  // Step 3 — Project details
  if (step === 3) {
    if (!data.budgetRange) errors.budgetRange = "Select a budget range";
  }

  // Step 4 — Contact
  if (step === 4) {
    if (!data.fullName.trim()) errors.fullName = "Full name is required";
    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(data.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!data.phone.trim()) errors.phone = "Phone number is required";
    if (!data.country.trim()) errors.country = "Country is required";
  }

  return errors;
}

export function validateAll(data: QuoteFormData): QuoteFormErrors {
  return [1, 2, 3, 4].reduce<QuoteFormErrors>((acc, step) => {
    return { ...acc, ...validateStep(step as QuoteStep, data) };
  }, {});
}

export function hasErrors(errors: QuoteFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function buildSubmissionPayload(
  data: QuoteFormData
): import("./types").QuoteSubmissionPayload {
  return {
    fullName: data.fullName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    companyName: data.companyName.trim(),
    country: data.country.trim(),
    projectType: data.projectType,
    width: data.width.trim(),
    height: data.height.trim(),
    environment: data.environment,
    colorType: data.colorType,
    acrylicBacking: data.acrylicBacking,
    installationRequired: data.installationRequired,
    budgetRange: data.budgetRange,
    estimatedPrice: data.estimatedPrice.trim(),
    message: data.message.trim(),
    fileName: data.file?.name ?? null,
    fileType: data.file?.type ?? null,
    submittedAt: new Date().toISOString(),
  };
}
