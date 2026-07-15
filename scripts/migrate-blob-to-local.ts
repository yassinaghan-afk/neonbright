/**
 * Migration utility to download Blob images and save them to local storage.
 * 
 * DO NOT RUN THIS YET - use only when ready to migrate.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-blob-to-local.ts
 * 
 * What it does:
 * 1. Reads $STORAGE_ROOT/cms-content.json (default: /app/storage or ./storage)
 * 2. Finds all Blob URLs in CMS content
 * 3. Downloads each Blob image/video
 * 4. Saves to $STORAGE_ROOT/uploads/[category]/
 * 5. Updates CMS content with new local URLs
 * 6. Creates a backup before making changes
 *
 * DO NOT RUN until explicitly approved.
 */

import { promises as fs } from "fs";
import path from "path";

const STORAGE_DIR = path.resolve(
  process.env.STORAGE_ROOT?.trim() || path.join(process.cwd(), "storage")
);
const CONTENT_FILE = path.join(STORAGE_DIR, "cms-content.json");
const UPLOADS_DIR = path.join(STORAGE_DIR, "uploads");

type CMSContent = {
  heroSlides?: Array<{ src?: string }>;
  partners?: Array<{ logoSrc?: string }>;
  brandsPageLogos?: Array<{ logoSrc?: string }>;
  portfolioProjects?: Array<{
    id: string;
    categoryId: string;
    featuredImage?: string;
    coverImage?: string;
    thumbnail?: string;
    gallery?: string[];
    images?: string[];
    logoFile?: string;
    beforeImage?: string;
    afterImage?: string;
  }>;
  testimonials?: Array<{ image?: string }>;
  reviews?: Array<{ image?: string }>;
  instagramPosts?: Array<{ image?: string; carouselImages?: string[] }>;
  instagramReels?: Array<{ thumbnail?: string }>;
  [key: string]: unknown;
};

function isBlobUrl(url: string): boolean {
  return (
    url.includes(".blob.vercel-storage.com/") ||
    url.includes(".public.blob.vercel-storage.com/")
  );
}

function extractFilename(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
}

function getCategoryFromPath(url: string): string {
  if (url.includes("/cms/") || url.includes("cms-")) return "cms";
  if (url.includes("/hero/") || url.includes("hero-")) return "hero";
  if (url.includes("/events/") || url.includes("event-")) return "events";
  if (url.includes("/brands/") || url.includes("brand-")) return "brands";
  if (url.includes("/reviews/") || url.includes("review-")) return "reviews";
  if (url.includes("/testimonials/") || url.includes("testimonial-")) return "testimonials";
  if (url.includes("/logos/") || url.includes("logo-")) return "logos";
  return "cms";
}

async function downloadBlob(url: string): Promise<Buffer> {
  console.log(`Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function saveToLocal(
  url: string,
  buffer: Buffer,
  category: string
): Promise<string> {
  const filename = extractFilename(url);
  const dir = path.join(UPLOADS_DIR, category);
  await ensureDir(dir);
  
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${category}/${filename}`;
}

function collectBlobUrls(content: CMSContent): Map<string, string> {
  const urls = new Map<string, string>(); // url -> category
  
  // Hero slides
  content.heroSlides?.forEach((slide) => {
    if (slide.src && isBlobUrl(slide.src)) {
      urls.set(slide.src, "hero");
    }
  });
  
  // Partners
  content.partners?.forEach((partner) => {
    if (partner.logoSrc && isBlobUrl(partner.logoSrc)) {
      urls.set(partner.logoSrc, "logos");
    }
  });
  
  // Brands page logos
  content.brandsPageLogos?.forEach((logo) => {
    if (logo.logoSrc && isBlobUrl(logo.logoSrc)) {
      urls.set(logo.logoSrc, "logos");
    }
  });
  
  // Portfolio projects
  content.portfolioProjects?.forEach((project) => {
    const category = project.categoryId.includes("marques") ? "brands" : "events";
    
    [
      project.featuredImage,
      project.coverImage,
      project.thumbnail,
      project.logoFile,
      project.beforeImage,
      project.afterImage,
      ...(project.gallery ?? []),
      ...(project.images ?? []),
    ].forEach((url) => {
      if (url && isBlobUrl(url)) {
        urls.set(url, category);
      }
    });
  });
  
  // Testimonials
  content.testimonials?.forEach((testimonial) => {
    if (testimonial.image && isBlobUrl(testimonial.image)) {
      urls.set(testimonial.image, "testimonials");
    }
  });
  
  // Reviews
  content.reviews?.forEach((review) => {
    if (review.image && isBlobUrl(review.image)) {
      urls.set(review.image, "reviews");
    }
  });
  
  // Instagram posts
  content.instagramPosts?.forEach((post) => {
    if (post.image && isBlobUrl(post.image)) {
      urls.set(post.image, "cms");
    }
    post.carouselImages?.forEach((url) => {
      if (isBlobUrl(url)) {
        urls.set(url, "cms");
      }
    });
  });
  
  // Instagram reels
  content.instagramReels?.forEach((reel) => {
    if (reel.thumbnail && isBlobUrl(reel.thumbnail)) {
      urls.set(reel.thumbnail, "cms");
    }
  });
  
  return urls;
}

function replaceBlobUrls(
  content: CMSContent,
  urlMap: Map<string, string>
): CMSContent {
  const replaceUrl = (url: string | undefined): string | undefined => {
    if (!url || !isBlobUrl(url)) return url;
    return urlMap.get(url) ?? url;
  };
  
  const replaceArray = (urls: string[] | undefined): string[] | undefined => {
    if (!urls) return urls;
    return urls.map((url) => replaceUrl(url) ?? url);
  };
  
  return {
    ...content,
    heroSlides: content.heroSlides?.map((slide) => ({
      ...slide,
      src: replaceUrl(slide.src),
    })),
    partners: content.partners?.map((partner) => ({
      ...partner,
      logoSrc: replaceUrl(partner.logoSrc),
    })),
    brandsPageLogos: content.brandsPageLogos?.map((logo) => ({
      ...logo,
      logoSrc: replaceUrl(logo.logoSrc),
    })),
    portfolioProjects: content.portfolioProjects?.map((project) => ({
      ...project,
      featuredImage: replaceUrl(project.featuredImage),
      coverImage: replaceUrl(project.coverImage),
      thumbnail: replaceUrl(project.thumbnail),
      logoFile: replaceUrl(project.logoFile),
      beforeImage: replaceUrl(project.beforeImage),
      afterImage: replaceUrl(project.afterImage),
      gallery: replaceArray(project.gallery),
      images: replaceArray(project.images),
    })),
    testimonials: content.testimonials?.map((testimonial) => ({
      ...testimonial,
      image: replaceUrl(testimonial.image),
    })),
    reviews: content.reviews?.map((review) => ({
      ...review,
      image: replaceUrl(review.image),
    })),
    instagramPosts: content.instagramPosts?.map((post) => ({
      ...post,
      image: replaceUrl(post.image),
      carouselImages: replaceArray(post.carouselImages),
    })),
    instagramReels: content.instagramReels?.map((reel) => ({
      ...reel,
      thumbnail: replaceUrl(reel.thumbnail),
    })),
  };
}

async function main() {
  console.log("🔍 Blob → Local Migration Utility\n");
  
  // Read CMS content
  console.log("📖 Reading CMS content...");
  const raw = await fs.readFile(CONTENT_FILE, "utf-8");
  const content = JSON.parse(raw) as CMSContent;
  
  // Collect all Blob URLs
  console.log("🔗 Collecting Blob URLs...");
  const blobUrls = collectBlobUrls(content);
  console.log(`Found ${blobUrls.size} Blob URLs\n`);
  
  if (blobUrls.size === 0) {
    console.log("✅ No Blob URLs found - nothing to migrate!");
    return;
  }
  
  // Create backup
  const backupFile = path.join(
    STORAGE_DIR,
    `cms-content.backup-${new Date().toISOString().replace(/:/g, "-")}.json`
  );
  console.log(`💾 Creating backup: ${backupFile}`);
  await fs.writeFile(backupFile, raw, "utf-8");
  
  // Download and save each Blob
  console.log("\n📥 Downloading Blob files...");
  const urlMap = new Map<string, string>(); // blob URL -> local URL
  let downloaded = 0;
  let failed = 0;
  
  for (const [blobUrl, category] of blobUrls.entries()) {
    try {
      const buffer = await downloadBlob(blobUrl);
      const localUrl = await saveToLocal(blobUrl, buffer, category);
      urlMap.set(blobUrl, localUrl);
      downloaded++;
      console.log(`✓ ${blobUrl} → ${localUrl}`);
    } catch (err) {
      failed++;
      console.error(`✗ Failed to download ${blobUrl}:`, err);
    }
  }
  
  console.log(`\n📊 Results: ${downloaded} downloaded, ${failed} failed\n`);
  
  if (downloaded === 0) {
    console.log("⚠️  No files were downloaded - aborting migration");
    return;
  }
  
  // Update CMS content
  console.log("📝 Updating CMS content with local URLs...");
  const updatedContent = replaceBlobUrls(content, urlMap);
  
  // Save updated content
  await fs.writeFile(
    CONTENT_FILE,
    JSON.stringify(updatedContent, null, 2),
    "utf-8"
  );
  
  console.log("✅ Migration complete!");
  console.log(`   Backup: ${backupFile}`);
  console.log(`   Updated: ${CONTENT_FILE}`);
  console.log(`   Downloaded: ${downloaded} files`);
  console.log(`   Failed: ${failed} files`);
}

// Run migration
main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
