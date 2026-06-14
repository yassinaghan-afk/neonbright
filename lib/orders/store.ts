import { promises as fs } from "fs";
import path from "path";
import { createId } from "@/lib/cms/id";
import {
  addLeadActivity,
  getLeadById,
  setLeadOrderId,
  updateLead,
} from "@/lib/leads/store";
import type { Lead } from "@/lib/leads/types";
import type {
  Order,
  OrderDesignFile,
  OrderFilters,
  OrderTimelineEvent,
  OrderUpdateInput,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const CONVERTIBLE_LEAD_STATUSES = new Set<Lead["status"]>(["quoted", "won"]);

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readOrders(): Promise<Order[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    return JSON.parse(raw) as Order[];
  } catch {
    await writeOrders([]);
    return [];
  }
}

export async function writeOrders(orders: Order[]): Promise<Order[]> {
  await ensureDataDir();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return orders;
}

function createTimelineEvent(
  type: OrderTimelineEvent["type"],
  message: string,
  createdBy?: string,
  metadata?: Record<string, string>
): OrderTimelineEvent {
  return {
    id: createId("evt"),
    type,
    message,
    createdAt: new Date().toISOString(),
    createdBy,
    metadata,
  };
}

async function generateOrderNumber(): Promise<string> {
  const orders = await readOrders();
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const prefix = `ORD-${y}${m}${d}`;
  const todayCount = orders.filter((o) => o.orderNumber.startsWith(prefix)).length;
  return `${prefix}-${String(todayCount + 1).padStart(4, "0")}`;
}

function buildDesignFilesFromLead(lead: Lead): OrderDesignFile[] {
  if (!lead.fileUrl || !lead.fileName || !lead.fileType) return [];
  return [
    {
      id: createId("file"),
      url: lead.fileUrl,
      fileName: lead.fileName,
      fileType: lead.fileType,
      uploadedAt: lead.createdAt,
    },
  ];
}

export async function convertLeadToOrder(
  leadId: string,
  adminEmail?: string
): Promise<{ order: Order; lead: Lead } | { error: string }> {
  const lead = await getLeadById(leadId);
  if (!lead) return { error: "Lead not found" };
  if (lead.orderId) return { error: "Lead has already been converted to an order" };
  if (!CONVERTIBLE_LEAD_STATUSES.has(lead.status)) {
    return { error: "Lead must be Quoted or Won before converting to an order" };
  }

  const now = new Date().toISOString();
  const orderNumber = await generateOrderNumber();

  const order: Order = {
    id: createId("ord"),
    orderNumber,
    status: "pending",
    leadId: lead.id,
    leadReference: lead.reference,
    customer: {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
    },
    project: {
      projectType: lead.projectType,
      width: lead.width,
      height: lead.height,
      environment: lead.environment,
      colorType: lead.colorType,
      acrylicBacking: lead.acrylicBacking,
      installationRequired: lead.installationRequired,
      budgetRange: lead.budgetRange,
      message: lead.message,
    },
    quotedAmount: lead.estimatedQuote,
    quoteNotes: lead.estimatedQuoteNotes,
    designFiles: buildDesignFilesFromLead(lead),
    productionNotes: "",
    internalNotes: lead.internalNotes,
    estimatedDeliveryDate: null,
    actualDeliveryDate: null,
    timeline: [
      createTimelineEvent(
        "created",
        `Order created from lead ${lead.reference}`,
        adminEmail,
        { leadId: lead.id, orderNumber }
      ),
    ],
    createdAt: now,
    updatedAt: now,
  };

  const orders = await readOrders();
  orders.unshift(order);
  await writeOrders(orders);

  let updatedLead = await updateLead(
    leadId,
    lead.status === "quoted" ? { status: "won" } : {},
    adminEmail
  );
  if (!updatedLead) return { error: "Failed to update lead" };

  updatedLead = (await setLeadOrderId(leadId, order.id))!;
  await addLeadActivity(
    leadId,
    `Converted to order ${orderNumber}`,
    adminEmail
  );
  updatedLead = (await getLeadById(leadId))!;

  return { order, lead: updatedLead };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByLeadId(leadId: string): Promise<Order | null> {
  const orders = await readOrders();
  return orders.find((o) => o.leadId === leadId) ?? null;
}

export async function updateOrder(
  id: string,
  input: OrderUpdateInput,
  adminEmail?: string
): Promise<Order | null> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = orders[index];
  const timeline = [...current.timeline];

  if (input.status && input.status !== current.status) {
    timeline.unshift(
      createTimelineEvent(
        "status_change",
        `Status changed from ${current.status.replace(/_/g, " ")} to ${input.status.replace(/_/g, " ")}`,
        adminEmail,
        { from: current.status, to: input.status }
      )
    );

    if (input.status === "delivered" && !input.actualDeliveryDate && !current.actualDeliveryDate) {
      input.actualDeliveryDate = new Date().toISOString().slice(0, 10);
      timeline.unshift(
        createTimelineEvent(
          "delivery_updated",
          `Actual delivery date set to ${input.actualDeliveryDate}`,
          adminEmail
        )
      );
    }
  }

  if (
    input.estimatedDeliveryDate !== undefined &&
    input.estimatedDeliveryDate !== current.estimatedDeliveryDate
  ) {
    timeline.unshift(
      createTimelineEvent(
        "delivery_updated",
        input.estimatedDeliveryDate
          ? `Estimated delivery updated to ${input.estimatedDeliveryDate}`
          : "Estimated delivery date cleared",
        adminEmail
      )
    );
  }

  if (
    input.actualDeliveryDate !== undefined &&
    input.actualDeliveryDate !== current.actualDeliveryDate &&
    input.status !== "delivered"
  ) {
    timeline.unshift(
      createTimelineEvent(
        "delivery_updated",
        input.actualDeliveryDate
          ? `Actual delivery updated to ${input.actualDeliveryDate}`
          : "Actual delivery date cleared",
        adminEmail
      )
    );
  }

  const updated: Order = {
    ...current,
    ...input,
    timeline,
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  await writeOrders(orders);
  return updated;
}

export async function addOrderActivity(
  id: string,
  message: string,
  adminEmail?: string
): Promise<Order | null> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = orders[index];
  const updated: Order = {
    ...current,
    timeline: [
      createTimelineEvent("note", message, adminEmail),
      ...current.timeline,
    ],
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  await writeOrders(orders);
  return updated;
}

export async function addOrderDesignFile(
  id: string,
  file: Omit<OrderDesignFile, "id" | "uploadedAt"> & { uploadedBy?: string }
): Promise<Order | null> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = orders[index];
  const designFile: OrderDesignFile = {
    id: createId("file"),
    uploadedAt: new Date().toISOString(),
    ...file,
  };

  const updated: Order = {
    ...current,
    designFiles: [...current.designFiles, designFile],
    timeline: [
      createTimelineEvent(
        "file_uploaded",
        `Design file uploaded: ${file.fileName}`,
        file.uploadedBy
      ),
      ...current.timeline,
    ],
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  await writeOrders(orders);
  return updated;
}

export async function filterOrders(filters: OrderFilters): Promise<Order[]> {
  let orders = await readOrders();

  if (filters.status && filters.status !== "all") {
    orders = orders.filter((o) => o.status === filters.status);
  }

  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.leadReference.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.companyName.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q)
    );
  }

  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderStats() {
  const orders = await readOrders();
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    design: orders.filter((o) => o.status === "design").length,
    in_production: orders.filter((o) => o.status === "in_production").length,
    ready: orders.filter((o) => o.status === "ready").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    active: orders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status)
    ).length,
  };
}
