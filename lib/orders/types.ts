export type OrderStatus =
  | "pending"
  | "design"
  | "in_production"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderTimelineEventType =
  | "created"
  | "status_change"
  | "note"
  | "file_uploaded"
  | "delivery_updated"
  | "system";

export type OrderTimelineEvent = {
  id: string;
  type: OrderTimelineEventType;
  message: string;
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, string>;
};

export type OrderDesignFile = {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy?: string;
};

export type OrderCustomer = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
};

export type OrderProject = {
  projectType: string;
  width: string;
  height: string;
  environment: string;
  colorType: string;
  acrylicBacking: boolean;
  installationRequired: boolean;
  budgetRange: string;
  message: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  leadId: string;
  leadReference: string;

  customer: OrderCustomer;
  project: OrderProject;

  quotedAmount: string;
  quoteNotes: string;
  designFiles: OrderDesignFile[];
  productionNotes: string;
  internalNotes: string;

  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;

  timeline: OrderTimelineEvent[];

  createdAt: string;
  updatedAt: string;
};

export type OrderUpdateInput = Partial<
  Pick<
    Order,
    | "status"
    | "productionNotes"
    | "internalNotes"
    | "estimatedDeliveryDate"
    | "actualDeliveryDate"
    | "quotedAmount"
    | "quoteNotes"
  >
>;

export type OrderFilters = {
  status?: OrderStatus | "all";
  search?: string;
};
