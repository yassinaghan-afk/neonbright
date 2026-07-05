import { readCMSContent } from "@/lib/cms/store";
import { sortByOrder } from "@/lib/cms/normalize";
import type { PartnerLogo } from "@/lib/cms/logo-media";
import type { CMSBrandsPageLogo } from "@/lib/cms/types";

const DEFAULT_STRIP_LABEL = "Ils nous font confiance";

function logosFromCMS(items: CMSBrandsPageLogo[]): PartnerLogo[] {
  return sortByOrder(items)
    .filter((item) => item.enabled && item.logoUrl && item.name)
    .map((item) => ({
      id: item.id,
      src: item.logoUrl.split("?")[0],
      alt: item.name,
    }));
}

export async function getBrandsPageLogos(): Promise<{
  logos: PartnerLogo[];
  stripLabel: string;
}> {
  const content = await readCMSContent();
  return {
    logos: logosFromCMS(content.brandsPageLogos),
    stripLabel: DEFAULT_STRIP_LABEL,
  };
}
