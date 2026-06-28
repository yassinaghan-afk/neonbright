import type { BudgetRange, ProjectType } from "./types";

export const QUOTE_STEPS = [
  { id: 1, label: "Produit", description: "Configuration" },
  { id: 2, label: "Fichier", description: "Votre logo" },
  { id: 3, label: "Détails", description: "Projet" },
  { id: 4, label: "Contact", description: "Coordonnées" },
  { id: 5, label: "Validation", description: "Envoi" },
] as const;

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "custom-logo-neon", label: "Néon logo personnalisé" },
  { value: "restaurant-signage", label: "Enseigne restaurant" },
  { value: "hotel-signage", label: "Enseigne hôtel" },
  { value: "retail-signage", label: "Enseigne boutique / retail" },
  { value: "event-neon", label: "Néon événementiel" },
  { value: "corporate-installation", label: "Installation corporate" },
];

export const BUDGET_RANGES: { value: BudgetRange; label: string }[] = [
  { value: "under-500", label: "Moins de 5 000 MAD" },
  { value: "500-1500", label: "5 000 – 15 000 MAD" },
  { value: "1500-5000", label: "15 000 – 50 000 MAD" },
  { value: "5000-plus", label: "50 000 MAD et plus" },
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
  "Maroc",
  "France",
  "États-Unis",
  "Royaume-Uni",
  "Émirats arabes unis",
  "Arabie saoudite",
  "Espagne",
  "Allemagne",
  "Italie",
  "Canada",
  "Belgique",
  "Pays-Bas",
  "Autre",
] as const;
