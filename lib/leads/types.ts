import type { DesignerSnapshot } from "@/lib/designer/types";

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export type TimelineEventType =
  | "created"
  | "status_change"
  | "note"
  | "quote_updated"
  | "system";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  message: string;
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, string>;
};

export type Lead = {
  id: string;
  reference: string;
  status: LeadStatus;

  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;

  projectType: string;
  width: string;
  height: string;
  environment: string;
  colorType: string;
  acrylicBacking: boolean;
  installationRequired: boolean;
  budgetRange: string;
  estimatedPrice: string;
  message: string;

  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;

  designerData: DesignerSnapshot | null;
  wallImageUrl: string | null;
  previewImageUrl: string | null;

  estimatedQuote: string;
  estimatedQuoteNotes: string;
  internalNotes: string;

  timeline: TimelineEvent[];

  orderId: string | null;

  createdAt: string;
  updatedAt: string;
};

export type LeadCreateInput = Omit<
  Lead,
  | "id"
  | "reference"
  | "status"
  | "estimatedQuote"
  | "estimatedQuoteNotes"
  | "internalNotes"
  | "orderId"
  | "designerData"
  | "wallImageUrl"
  | "previewImageUrl"
  | "timeline"
  | "createdAt"
  | "updatedAt"
>;

export type LeadUpdateInput = Partial<
  Pick<
    Lead,
    | "status"
  | "estimatedQuote"
  | "estimatedQuoteNotes"
  | "internalNotes"
  | "orderId"
  >
>;

export type LeadFilters = {
  status?: LeadStatus | "all";
  search?: string;
};
