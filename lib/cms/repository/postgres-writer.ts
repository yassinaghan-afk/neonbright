/**
 * PostgreSQL write path for Admin mutations (CMS_STORAGE=postgres only).
 *
 * Admin routes build a complete next CMSContent (exactly as they do for the
 * JSON store); this module persists that snapshot transactionally:
 *   - upserts every record by stable ID (partial-update safe: routes already
 *     merged fields, so omitted fields keep their existing values)
 *   - removes only records the Admin explicitly deleted (present in DB,
 *     absent from the new snapshot of that collection)
 *   - single transaction: nothing commits unless everything succeeds
 *   - records a CmsRevision row for optimistic concurrency/audit
 *
 * Never dual-writes to JSON.
 */

import { getPrisma } from "@/lib/db/prisma";
import {
  categoryToRow,
  contentCounts,
  faqToRow,
  featureToRow,
  heroSlideToRow,
  industryToRow,
  instagramPostToRow,
  instagramReelToRow,
  navToRow,
  partnerToRow,
  processStepToRow,
  projectMediaRows,
  projectToRow,
  reviewToRow,
  serviceToRow,
  settingsFromContent,
  testimonialToRow,
} from "@/lib/db/cms-mapping";
import type { CMSContent } from "@/lib/cms/types";

type Tx = Parameters<Parameters<ReturnType<typeof getPrisma>["$transaction"]>[0]>[0];

async function syncCollection(
  ids: string[],
  dbIds: string[],
  upsert: (id: string) => Promise<void>,
  remove: (ids: string[]) => Promise<void>
): Promise<void> {
  const keep = new Set(ids);
  const toDelete = dbIds.filter((id) => !keep.has(id));
  for (const id of ids) await upsert(id);
  if (toDelete.length) await remove(toDelete);
}

export async function writeContentToPostgres(content: CMSContent): Promise<CMSContent> {
  const prisma = getPrisma();
  const nextRevision = (content.revision ?? 0) + 1;
  const updatedAt = new Date();

  await prisma.$transaction(
    async (tx: Tx) => {
      // Portfolio categories
      {
        const rows = (content.portfolioCategories ?? []).map(categoryToRow);
        const dbIds = (await tx.portfolioCategory.findMany({ select: { id: true } })).map(
          (r: { id: string }) => r.id
        );
        const byId = new Map(rows.map((r) => [r.id, r]));
        await syncCollection(
          rows.map((r) => r.id),
          dbIds,
          async (id) => {
            const row = byId.get(id)!;
            await tx.portfolioCategory.upsert({ where: { id }, create: row, update: row });
          },
          async (ids) => {
            await tx.portfolioCategory.deleteMany({ where: { id: { in: ids } } });
          }
        );
      }

      // Portfolio projects + media
      {
        const projects = content.portfolioProjects ?? [];
        const dbIds = (await tx.portfolioProject.findMany({ select: { id: true } })).map(
          (r: { id: string }) => r.id
        );
        const byId = new Map(projects.map((p) => [p.id, p]));
        await syncCollection(
          projects.map((p) => p.id),
          dbIds,
          async (id) => {
            const p = byId.get(id)!;
            const row = projectToRow(p);
            await tx.portfolioProject.upsert({ where: { id }, create: row, update: row });
            await tx.projectMedia.deleteMany({ where: { projectId: id } });
            const media = projectMediaRows(p);
            if (media.length) await tx.projectMedia.createMany({ data: media });
          },
          async (ids) => {
            await tx.portfolioProject.deleteMany({ where: { id: { in: ids } } });
          }
        );
      }

      // Simple collections
      const simpleSyncs: Array<{
        ids: string[];
        dbIds: () => Promise<string[]>;
        upsert: (id: string) => Promise<void>;
        remove: (ids: string[]) => Promise<void>;
      }> = [
        {
          ids: (content.heroSlides ?? []).map((s) => s.id),
          dbIds: async () =>
            (await tx.heroSlide.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = heroSlideToRow((content.heroSlides ?? []).find((s) => s.id === id)!);
            await tx.heroSlide.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.heroSlide.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.partners ?? []).map((p) => p.id),
          dbIds: async () =>
            (
              await tx.partner.findMany({ where: { kind: "partner" }, select: { id: true } })
            ).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = partnerToRow((content.partners ?? []).find((p) => p.id === id)!, "partner");
            await tx.partner.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.partner.deleteMany({ where: { id: { in: ids }, kind: "partner" } });
          },
        },
        {
          ids: (content.brandsPageLogos ?? []).map((p) => p.id),
          dbIds: async () =>
            (
              await tx.partner.findMany({ where: { kind: "brandsLogo" }, select: { id: true } })
            ).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = partnerToRow(
              (content.brandsPageLogos ?? []).find((p) => p.id === id)!,
              "brandsLogo"
            );
            await tx.partner.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.partner.deleteMany({ where: { id: { in: ids }, kind: "brandsLogo" } });
          },
        },
        {
          ids: (content.reviews ?? []).map((r) => r.id),
          dbIds: async () =>
            (await tx.review.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = reviewToRow((content.reviews ?? []).find((r) => r.id === id)!);
            await tx.review.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.review.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.testimonials ?? []).map((t) => t.id),
          dbIds: async () =>
            (await tx.testimonial.findMany({ select: { id: true } })).map(
              (r: { id: string }) => r.id
            ),
          upsert: async (id) => {
            const row = testimonialToRow((content.testimonials ?? []).find((t) => t.id === id)!);
            await tx.testimonial.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.testimonial.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.instagramPosts ?? []).map((p) => p.id),
          dbIds: async () =>
            (await tx.instagramPost.findMany({ select: { id: true } })).map(
              (r: { id: string }) => r.id
            ),
          upsert: async (id) => {
            const row = instagramPostToRow(
              (content.instagramPosts ?? []).find((p) => p.id === id)!
            );
            await tx.instagramPost.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.instagramPost.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.instagramReels ?? []).map((r) => r.id),
          dbIds: async () =>
            (await tx.instagramReel.findMany({ select: { id: true } })).map(
              (r: { id: string }) => r.id
            ),
          upsert: async (id) => {
            const row = instagramReelToRow(
              (content.instagramReels ?? []).find((r) => r.id === id)!
            );
            await tx.instagramReel.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.instagramReel.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.features ?? []).map((f) => f.id),
          dbIds: async () =>
            (await tx.feature.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = featureToRow((content.features ?? []).find((f) => f.id === id)!);
            await tx.feature.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.feature.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.industries ?? []).map((i) => i.id),
          dbIds: async () =>
            (await tx.industry.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = industryToRow((content.industries ?? []).find((i) => i.id === id)!);
            await tx.industry.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.industry.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.processSteps ?? []).map((s) => s.id),
          dbIds: async () =>
            (await tx.processStep.findMany({ select: { id: true } })).map(
              (r: { id: string }) => r.id
            ),
          upsert: async (id) => {
            const row = processStepToRow((content.processSteps ?? []).find((s) => s.id === id)!);
            await tx.processStep.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.processStep.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.faq ?? []).map((f) => f.id),
          dbIds: async () =>
            (await tx.fAQ.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = faqToRow((content.faq ?? []).find((f) => f.id === id)!);
            await tx.fAQ.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.fAQ.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.services ?? []).map((s) => s.id),
          dbIds: async () =>
            (await tx.service.findMany({ select: { id: true } })).map((r: { id: string }) => r.id),
          upsert: async (id) => {
            const row = serviceToRow((content.services ?? []).find((s) => s.id === id)!);
            await tx.service.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.service.deleteMany({ where: { id: { in: ids } } });
          },
        },
        {
          ids: (content.nav ?? []).map((n) => n.id),
          dbIds: async () =>
            (await tx.navigationItem.findMany({ select: { id: true } })).map(
              (r: { id: string }) => r.id
            ),
          upsert: async (id) => {
            const row = navToRow((content.nav ?? []).find((n) => n.id === id)!);
            await tx.navigationItem.upsert({ where: { id }, create: row, update: row });
          },
          remove: async (ids) => {
            await tx.navigationItem.deleteMany({ where: { id: { in: ids } } });
          },
        },
      ];

      for (const sync of simpleSyncs) {
        await syncCollection(sync.ids, await sync.dbIds(), sync.upsert, sync.remove);
      }

      // Singleton settings blocks
      for (const { key, value } of settingsFromContent(content)) {
        await tx.siteSetting.upsert({
          where: { key },
          create: { key, value: value as object },
          update: { value: value as object },
        });
      }

      // Revision/audit row
      await tx.cmsRevision.create({
        data: {
          revision: nextRevision,
          source: "admin",
          note: "admin mutation",
          counts: contentCounts(content),
        },
      });
    },
    { timeout: 60_000 }
  );

  return {
    ...content,
    revision: nextRevision,
    updatedAt: updatedAt.toISOString(),
  };
}
