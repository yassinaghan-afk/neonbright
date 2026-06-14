import type { Lead } from "@/lib/leads/types";
import { labelForBudget, labelForProjectType } from "@/lib/leads/helpers";
import { getSiteUrl } from "./config";

function absUrl(siteUrl: string, path: string | null): string {
  if (!path) return "—";
  if (path.startsWith("http")) return path;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

export function buildNewLeadWhatsAppMessage(lead: Lead, siteUrl?: string): string {
  const base = siteUrl ?? getSiteUrl();
  const lines = [
    `🆕 *New Quote — ${lead.reference}*`,
    "",
    "👤 *Customer*",
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    lead.companyName ? `Company: ${lead.companyName}` : null,
    lead.country ? `Country: ${lead.country}` : null,
    "",
    "📋 *Project*",
    `Type: ${labelForProjectType(lead.projectType) || "—"}`,
    lead.width && lead.height ? `Size: ${lead.width} × ${lead.height} cm` : null,
    lead.environment ? `Environment: ${lead.environment}` : null,
    lead.colorType ? `Color option: ${lead.colorType}` : null,
    lead.budgetRange ? `Budget range: ${labelForBudget(lead.budgetRange)}` : null,
    lead.estimatedPrice ? `Estimated price: ${lead.estimatedPrice}` : null,
    lead.message ? `Notes: ${lead.message}` : null,
  ].filter(Boolean) as string[];

  if (lead.designerData) {
    lines.push("", "🎨 *Visual Designer*");
    lines.push(`Sign type: ${lead.designerData.signType === "text" ? "Text Neon" : "Logo Neon"}`);
    if (lead.designerData.signType === "text") {
      lines.push(`Text: "${lead.designerData.text}"`);
      lines.push(`Font: ${lead.designerData.fontFamily}`);
    }
    lines.push(`Neon color: ${lead.designerData.color}`);
    lines.push(`Glow: ${lead.designerData.glowIntensity}%`);
  }

  const assets: string[] = [];
  if (lead.fileUrl) assets.push(`Logo: ${absUrl(base, lead.fileUrl)}`);
  if (lead.wallImageUrl) assets.push(`Wall photo: ${absUrl(base, lead.wallImageUrl)}`);
  if (lead.previewImageUrl) assets.push(`Preview: ${absUrl(base, lead.previewImageUrl)}`);

  if (assets.length) {
    lines.push("", "📎 *Assets*", ...assets);
  }

  lines.push("", `Ref: ${lead.reference}`);
  return lines.join("\n");
}
