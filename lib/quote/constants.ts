import type { BudgetRange, ProjectType } from "./types";

export const QUOTE_STEPS = [
  { id: 1, label: "Product", description: "Configuration" },
  { id: 2, label: "Upload", description: "Your logo" },
  { id: 3, label: "Details", description: "Project info" },
  { id: 4, label: "Contact", description: "Your details" },
  { id: 5, label: "Review", description: "Submit" },
] as const;

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "custom-logo-neon", label: "Custom Logo Neon" },
  { value: "restaurant-signage", label: "Restaurant Signage" },
  { value: "hotel-signage", label: "Hotel Signage" },
  { value: "retail-signage", label: "Retail Signage" },
  { value: "event-neon", label: "Event Neon" },
  { value: "corporate-installation", label: "Corporate Installation" },
];

export const BUDGET_RANGES: { value: BudgetRange; label: string }[] = [
  { value: "under-500", label: "Under $500" },
  { value: "500-1500", label: "$500 – $1,500" },
  { value: "1500-5000", label: "$1,500 – $5,000" },
  { value: "5000-plus", label: "$5,000+" },
];

export const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "application/pdf",
];

export const ACCEPTED_FILE_EXTENSIONS = ".png,.jpg,.jpeg,.svg,.pdf";

export const MAX_FILE_SIZE_MB = 10;

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const COUNTRIES = [
  "Morocco",
  "France",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Spain",
  "Germany",
  "Italy",
  "Canada",
  "Belgium",
  "Netherlands",
  "Other",
] as const;
