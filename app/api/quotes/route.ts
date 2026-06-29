import { promises as fs } from "fs";
import path from "path";
import { jsonError, jsonOk } from "@/lib/cms/api";
import {
  createLead,
  getLeadById,
  updateLeadDesignerAssets,
  updateLeadFiles,
} from "@/lib/leads/store";
import type { DesignerSnapshot } from "@/lib/designer/types";
import { buildWhatsAppUrl, getSiteUrl } from "@/lib/whatsapp/config";
import { readCMSContent } from "@/lib/cms/store";
import { buildNewLeadWhatsAppMessage } from "@/lib/whatsapp/message";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/quote/constants";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/leads");
const WALL_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function saveLeadFile(
  leadId: string,
  file: File,
  suffix: string
): Promise<{ fileUrl: string; fileName: string; fileType: string }> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filename = `${leadId}-${suffix}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return {
    fileUrl: `/uploads/leads/${filename}`,
    fileName: file.name,
    fileType: file.type,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const siteUrl = getSiteUrl(new URL(request.url).origin);

    const get = (key: string) => {
      const val = formData.get(key);
      return typeof val === "string" ? val : "";
    };

    const getBool = (key: string) => formData.get(key) === "true";

    if (!get("fullName") || !get("email") || !get("phone")) {
      return jsonError("Contact information is required.");
    }

    if (!get("country")) {
      return jsonError("Country is required.");
    }

    const file = formData.get("file");
    const wallImage = formData.get("wallImage");
    const previewImage = formData.get("previewImage");
    const designerRaw = get("designerData");

    let designerData: DesignerSnapshot | null = null;
    if (designerRaw) {
      try {
        designerData = JSON.parse(designerRaw) as DesignerSnapshot;
      } catch {
        return jsonError("Invalid designer data.");
      }
    }

    const lead = await createLead({
      fullName: get("fullName"),
      email: get("email"),
      phone: get("phone"),
      companyName: get("companyName"),
      country: get("country"),
      projectType: get("projectType"),
      width: get("width"),
      height: get("height"),
      environment: get("environment"),
      colorType: get("colorType"),
      acrylicBacking: getBool("acrylicBacking"),
      installationRequired: getBool("installationRequired"),
      budgetRange: get("budgetRange"),
      estimatedPrice: get("estimatedPrice"),
      message: get("message"),
      fileUrl: null,
      fileName: null,
      fileType: null,
    });

    if (file && file instanceof File && file.size > 0) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        return jsonError("Invalid file type. Use PNG, JPG, SVG, or PDF.");
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return jsonError("File must be under 10 MB.");
      }
      const saved = await saveLeadFile(lead.id, file, "logo");
      await updateLeadFiles(lead.id, saved);
    }

    let wallImageUrl: string | null = null;
    let previewImageUrl: string | null = null;

    if (wallImage instanceof File && wallImage.size > 0) {
      if (!WALL_TYPES.includes(wallImage.type)) {
        return jsonError("Invalid wall image. Use JPG, PNG, or WEBP.");
      }
      wallImageUrl = (await saveLeadFile(lead.id, wallImage, "wall")).fileUrl;
    }

    if (previewImage instanceof File && previewImage.size > 0) {
      previewImageUrl = (await saveLeadFile(lead.id, previewImage, "preview")).fileUrl;
    }

    if (designerData || wallImageUrl || previewImageUrl) {
      await updateLeadDesignerAssets(lead.id, {
        designerData,
        wallImageUrl,
        previewImageUrl,
      });
    }

    const savedLead = (await getLeadById(lead.id))!;
    const whatsappMessage = buildNewLeadWhatsAppMessage(savedLead, siteUrl);
    const cms = await readCMSContent();
    const whatsappNumber =
      cms.contact.whatsapp?.trim() || cms.contact.phone?.trim() || "";
    const whatsappUrl = buildWhatsAppUrl(whatsappNumber, whatsappMessage);

    return jsonOk(
      {
        success: true,
        reference: savedLead.reference,
        id: savedLead.id,
        whatsappUrl,
      },
      201
    );
  } catch {
    return jsonError("Failed to submit quote request", 500);
  }
}
