export type ProjectType =
  | "custom-logo-neon"
  | "restaurant-signage"
  | "hotel-signage"
  | "retail-signage"
  | "event-neon"
  | "corporate-installation";

export type EnvironmentType = "indoor" | "outdoor";

export type ColorType = "single-color" | "rgb";

export type BudgetRange =
  | "under-500"
  | "500-1500"
  | "1500-5000"
  | "5000-plus";

export type QuoteFormData = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;
  projectType: ProjectType | "";
  width: string;
  height: string;
  environment: EnvironmentType | "";
  colorType: ColorType | "";
  acrylicBacking: boolean;
  installationRequired: boolean;
  budgetRange: BudgetRange | "";
  estimatedPrice: string;
  message: string;
  file: File | null;
};

export type QuoteFormErrors = Partial<Record<keyof QuoteFormData, string>>;

export type QuoteStep = 1 | 2 | 3 | 4 | 5;

export const INITIAL_QUOTE_FORM: QuoteFormData = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  country: "",
  projectType: "",
  width: "",
  height: "",
  environment: "",
  colorType: "",
  acrylicBacking: false,
  installationRequired: false,
  budgetRange: "",
  estimatedPrice: "",
  message: "",
  file: null,
};

export type QuoteSubmissionPayload = Omit<QuoteFormData, "file"> & {
  fileName: string | null;
  fileType: string | null;
  submittedAt: string;
};
