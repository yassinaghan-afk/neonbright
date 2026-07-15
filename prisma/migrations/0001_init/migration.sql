-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "PortfolioCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAccent" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "coverAlt" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL DEFAULT '',
    "pageTitle" TEXT NOT NULL DEFAULT '',
    "pageSubtitle" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "PortfolioCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "client" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "featuredImage" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accent" TEXT NOT NULL DEFAULT 'neon-pink',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT,
    "typeLabel" TEXT,
    "logoFile" TEXT,
    "installationType" TEXT,
    "beforeImage" TEXT,
    "afterImage" TEXT,
    "relatedProjectSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "subtitle" TEXT,
    "custom" JSONB,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMedia" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "HeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'partner',
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "company" TEXT,
    "photo" TEXT,
    "rating" INTEGER,
    "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioFiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "carouselImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "altText" TEXT,
    "caption" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "custom" JSONB,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramReel" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "InstagramReel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStep" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "ProcessStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "custom" JSONB,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CmsRevision" (
    "id" SERIAL NOT NULL,
    "revision" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "counts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioCategory_slug_key" ON "PortfolioCategory"("slug");

-- CreateIndex
CREATE INDEX "PortfolioCategory_sortOrder_idx" ON "PortfolioCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioCategory_enabled_sortOrder_idx" ON "PortfolioCategory"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioProject_slug_idx" ON "PortfolioProject"("slug");

-- CreateIndex
CREATE INDEX "PortfolioProject_categoryId_idx" ON "PortfolioProject"("categoryId");

-- CreateIndex
CREATE INDEX "PortfolioProject_published_idx" ON "PortfolioProject"("published");

-- CreateIndex
CREATE INDEX "PortfolioProject_sortOrder_idx" ON "PortfolioProject"("sortOrder");

-- CreateIndex
CREATE INDEX "PortfolioProject_categoryId_published_sortOrder_idx" ON "PortfolioProject"("categoryId", "published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioProject_categoryId_slug_key" ON "PortfolioProject"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "ProjectMedia_projectId_role_sortOrder_idx" ON "ProjectMedia"("projectId", "role", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMedia_projectId_role_sortOrder_key" ON "ProjectMedia"("projectId", "role", "sortOrder");

-- CreateIndex
CREATE INDEX "HeroSlide_enabled_sortOrder_idx" ON "HeroSlide"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Partner_kind_enabled_sortOrder_idx" ON "Partner"("kind", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Review_enabled_sortOrder_idx" ON "Review"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_enabled_sortOrder_idx" ON "Testimonial"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "InstagramPost_enabled_sortOrder_idx" ON "InstagramPost"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "InstagramReel_enabled_sortOrder_idx" ON "InstagramReel"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Feature_enabled_sortOrder_idx" ON "Feature"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Industry_enabled_sortOrder_idx" ON "Industry"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "ProcessStep_sortOrder_idx" ON "ProcessStep"("sortOrder");

-- CreateIndex
CREATE INDEX "FAQ_enabled_sortOrder_idx" ON "FAQ"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Service_enabled_sortOrder_idx" ON "Service"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "NavigationItem_enabled_sortOrder_idx" ON "NavigationItem"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "CmsRevision_createdAt_idx" ON "CmsRevision"("createdAt");

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PortfolioCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

