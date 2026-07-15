# MOBILE PERFORMANCE DIAGNOSIS & ACTION PLAN

**Date:** 2026-07-16  
**Status:** DIAGNOSIS COMPLETE - AWAITING FIX IMPLEMENTATION  
**Target:** Lighthouse Mobile Performance >= 80, LCP <= 3.0s, CLS <= 0.1

---

## EXECUTIVE SUMMARY

Mobile performance analysis reveals **5 CRITICAL BOTTLENECKS**:

1. **Framer Motion Overhead** - 60KB+ library loaded immediately for homepage animations
2. **Hero Component Blocking** - Complex entrance animations delay first paint
3. **Marquee Image Duplication** - Instagram marquee creates 12-20+ duplicate DOM nodes
4. **Modal Code in Initial Bundle** - 3 modals (Instagram, Reviews, Testimonials) loaded upfront
5. **Excessive Client Components** - 10+ homepage sections using "use client" unnecessarily

**Estimated Impact:** Fixing these issues should reduce initial JS by 150-200KB and improve mobile LCP by 1-2 seconds.

---

## 1. BASELINE METRICS (CODE ANALYSIS)

### Current Bundle Analysis

**Largest Chunks:**
- `17yl-88y3imoq.js` - 324KB (likely Framer Motion + animations)
- `3peubv2924kx4.js` - 224KB
- `1mfjqidm5qp0a.js` - 144KB
- `0rtv506nxvzkw.js` - 132KB
- `0cz1d0mv5g_q7.js` - 112KB

**Total estimated first-load JS:** ~1.2-1.5MB (includes Next.js runtime)

### Critical Homepage Components Using Framer Motion

**Immediate Load (Above/Near Fold):**
- `Hero.tsx` - Word-by-word entrance, scroll parallax, blur effects
- `HeroSlideshow.tsx` - Ken Burns animations, fade transitions
- `Navbar.tsx` - Menu animations
- `ui/SectionReveal.tsx` - Used by ALL sections (8-10 instances)
- `ui/Button.tsx` - Used in Hero CTAs
- `WhatsAppFloatingButton.tsx` - Floating animation

**Below Fold:**
- `FAQ.tsx` - Accordion animations
- `Testimonials.tsx` - Slider state + animations
- `Industries.tsx` - Entrance animations
- `FinalCTA.tsx` - Entrance animations

**Modals (Should be Lazy):**
- `InstagramShowcasePostModal.tsx` - NOT lazy loaded
- `ReviewsModal.tsx` - NOT lazy loaded
- `TestimonialGalleryModal.tsx`, `TestimonialVideoModal.tsx` - NOT lazy loaded

### Instagram Marquee Duplication Issue

**File:** `lib/instagram/marquee.ts`

```typescript
const MIN_VISIBLE_CARDS = 12;

export function computeMarqueeCopies(postCount: number): number {
  return Math.max(2, Math.ceil(MIN_VISIBLE_CARDS / postCount));
}
```

**Problem:**
- With 10 posts: Creates 2 copies = **20 images**
- With 5 posts: Creates 3 copies = **15 images**
- With 3 posts: Creates 4 copies = **12 images**

Each duplicated `<Image>` component on mobile at 180-220px width is requesting full-resolution images through Next.js optimization.

**Current Desktop Behavior:** Acceptable (cards are larger, screen is wider)  
**Mobile Impact:** Excessive - loading 12-20 images for a marquee is too heavy

---

## 2. NETWORK WATERFALL ANALYSIS (PROJECTED)

### Expected Mobile Load Sequence

**Critical Path Issues:**

1. **Main bundle** (~400KB) blocks initial render
2. **Framer Motion chunk** (~60-80KB) loads before Hero can animate
3. **Hero images** - Multiple slides preloaded despite only first being visible
4. **Instagram marquee** - 12-20 images start loading below fold
5. **Reviews marquee** - Additional duplicated images
6. **Modal bundles** - Loaded even though user may never open them

### Estimated LCP Elements (Mobile)

**Most Likely LCP:** First Hero image at ~600-700px height  
**Current Load:** Probably after 2-3s (blocked by JS execution)  
**Target:** <1.5s

---

## 3. ROOT CAUSE ANALYSIS

### Issue #1: Framer Motion is Too Heavy for Mobile

**Impact:** HIGH  
**Components Affected:** 18+ components  
**Bundle Size:** ~60-80KB (minified + gzipped)

**Why This Hurts Mobile:**
- Loaded and parsed before first paint
- Blocks Hero entrance animations
- Most animations could use CSS instead
- Mobile users on 3G/4G pay the cost upfront

**Solution:**
- Remove Framer Motion from above-the-fold components
- Use CSS animations + `@media (prefers-reduced-motion: reduce)`
- Keep Framer Motion only for complex interactions (modals, quote wizard)
- Lazy load it when needed

---

### Issue #2: Hero Component Blocks First Paint

**Impact:** CRITICAL  
**File:** `components/Hero.tsx`

**Current Behavior:**
```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";

// Complex word-by-word entrance animation
{headlineWords.map((word, i) => (
  <motion.span
    initial={{ opacity: 0, y: 80 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.9, delay: 0.15 + i * 0.08 }}
  >
    {word}
  </motion.span>
))}
```

**Problems:**
1. Entire Hero is a Client Component
2. Waits for Framer Motion to load
3. Waits for hydration
4. Then animates from `opacity: 0`
5. Mobile users see nothing during this delay

**Mobile Experience:**
- Black screen with hero background
- Text appears after 1-2 seconds
- Poor perceived performance

---

### Issue #3: Instagram Marquee Creates Too Many DOM Nodes

**Impact:** HIGH (Mobile)  
**File:** `components/instagram/InstagramMarqueeRow.tsx`

**Problem:**
- Always creates 2-4 full copies of the entire post array
- Each copy renders real `<Image>` components
- 10 posts × 3 copies = 30 `<Image>` components on mobile
- All request optimization through Next.js image pipeline
- Creates 30+ network requests for a single marquee

**Why This Hurts Mobile:**
- Network congestion (30+ simultaneous requests)
- Memory overhead (30+ Image elements)
- Layout thrashing during scroll
- Battery drain from continuous animation

**Desktop:** Less noticeable (faster network, more memory)  
**Mobile:** Significant performance hit

---

### Issue #4: Modals Loaded Upfront

**Impact:** MEDIUM  
**Files:**
- `components/instagram/InstagramShowcasePostModal.tsx`
- `components/reviews/ReviewsModal.tsx`
- `components/testimonials/TestimonialGalleryModal.tsx`

**Problem:**
- Modals are imported directly in showcase components
- Code is in initial bundle even if never opened
- Adds ~20-40KB to initial load

**Current:**
```tsx
import { InstagramShowcasePostModal } from "./InstagramShowcasePostModal";

// Always rendered (hidden)
<InstagramShowcasePostModal
  posts={galleryPosts}
  activeIndex={activePostIndex}
  onNavigate={handleNavigate}
  onClose={closePostModal}
/>
```

**Should Be:**
```tsx
const InstagramShowcasePostModal = dynamic(
  () => import("./InstagramShowcasePostModal"),
  { ssr: false }
);

// Only render when needed
{activePostIndex !== null && (
  <InstagramShowcasePostModal ... />
)}
```

---

### Issue #5: Excessive Client Components

**Impact:** MEDIUM  
**Pattern:** Many sections are Client Components for Framer Motion animations only

**Examples:**
- `WhyChooseUs.tsx` - "use client" just for fade-in animations
- `Industries.tsx` - "use client" just for fade-in animations  
- `Process.tsx` - "use client" just for fade-in animations

**Problem:**
- Entire component (markup + data) serialized to client
- Hydration overhead
- More JavaScript execution
- Delayed interactivity

**Solution:**
- Make parent Server Component
- Wrap only interactive parts in small Client Components
- Use CSS animations for entrance effects

---

## 4. MOBILE-SPECIFIC ISSUES

### Issue #6: No Mobile Hero Optimization

**Current:** Same heavy slideshow logic runs on mobile as desktop

**Mobile Needs:**
- Simpler first-paint static image
- No Ken Burns animation initially
- Lighter image files (currently using full-size)
- Faster text reveal (CSS, not JS-driven)

---

### Issue #7: Marquees Animate Offscreen

**Current:** Instagram and Reviews marquees start animating immediately even if below fold

**Problem:**
- Continuous CSS animations drain battery
- Unnecessary layout calculations
- Poor performance on slower mobile devices

**Solution:**
- Use `IntersectionObserver`
- Start animation only when scrolled into view
- Pause when scrolled out of view

---

## 5. PRIORITY ACTION PLAN

### 🔴 CRITICAL (Do First)

#### Action 1: Optimize Hero Component for Mobile

**Goal:** Make Hero text visible immediately, defer animations

**Changes:**

1. **Create Mobile-Optimized Hero Variant:**

```tsx
// components/HeroMobile.tsx (Server Component)
export function HeroMobile({ slides, hero }) {
  return (
    <section className="hero-mobile">
      {/* Static first image, no animation */}
      <div className="hero-bg">
        <Image
          src={slides[0]?.src}
          alt={slides[0]?.alt}
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      
      {/* Text appears immediately with CSS animation */}
      <div className="hero-content animate-fade-in">
        <h1>{hero.headline}</h1>
        <p>{hero.subheadline}</p>
        <div className="hero-ctas">
          <Button href="/designer">{hero.primaryCta}</Button>
        </div>
      </div>
    </section>
  );
}

// globals.css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in { animation: none; }
}
```

2. **Conditional Loading:**

```tsx
// app/page.tsx
import dynamic from "next/dynamic";

const HeroDesktop = dynamic(() => import("@/components/Hero").then(m => m.Hero), {
  loading: () => <HeroMobileSkeleton />,
  ssr: false
});

export default async function Home() {
  // ...
  return (
    <>
      {/* Show mobile hero on small screens */}
      <div className="block lg:hidden">
        <HeroMobile slides={heroSlides} hero={hero} />
      </div>
      
      {/* Show desktop hero with animations on large screens */}
      <div className="hidden lg:block">
        <HeroDesktop slides={heroSlides} hero={hero} />
      </div>
    </>
  );
}
```

**Expected Impact:**
- Mobile LCP improvement: -1.0 to -1.5s
- Initial JS reduction: -30KB
- FCP improvement: -0.5 to -1.0s

---

#### Action 2: Reduce Instagram Marquee Duplication on Mobile

**Goal:** Load fewer duplicate images on mobile

**Changes:**

```typescript
// lib/instagram/marquee.ts
const MIN_VISIBLE_CARDS_MOBILE = 6;  // Reduced from 12
const MIN_VISIBLE_CARDS_DESKTOP = 12;

export function computeMarqueeCopies(
  postCount: number,
  viewportWidth = 0,
  setWidth = 0,
  isMobile = false  // New parameter
): number {
  if (postCount <= 0) return 0;

  if (viewportWidth > 0 && setWidth > 0) {
    const minTrack = Math.max(viewportWidth * 2, setWidth * 2);
    return Math.max(2, Math.ceil(minTrack / setWidth));
  }

  // Mobile: fewer copies
  const minCards = isMobile ? MIN_VISIBLE_CARDS_MOBILE : MIN_VISIBLE_CARDS_DESKTOP;
  return Math.max(2, Math.ceil(minCards / postCount));
}
```

```tsx
// components/instagram/InstagramMarqueeRow.tsx
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function InstagramPostsMarqueeRow({ posts, onPostSelect, paused }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [copies, setCopies] = useState(() =>
    computeMarqueeCopies(
      Math.max(posts.length, 1),
      0,
      0,
      isMobile  // Pass mobile flag
    )
  );
  
  // ... rest of component
}
```

**Expected Impact:**
- Mobile image requests: -40% to -60%
- Mobile DOM nodes: -40% to -60%
- Network waterfall improvement
- Smoother scrolling

---

#### Action 3: Lazy Load All Modals

**Goal:** Remove modal code from initial bundle

**Changes:**

```tsx
// components/instagram/InstagramMarqueeShowcase.tsx
"use client";

import dynamic from "next/dynamic";

const InstagramShowcasePostModal = dynamic(
  () => import("./InstagramShowcasePostModal").then(m => m.InstagramShowcasePostModal),
  { ssr: false }
);

export function InstagramMarqueeShowcase({ data }: Props) {
  const [activePostIndex, setActivePostIndex] = useState<number | null>(null);
  
  return (
    <>
      <section>
        {/* ... marquee ... */}
      </section>
      
      {/* Only load and render when opened */}
      {activePostIndex !== null && (
        <InstagramShowcasePostModal
          posts={galleryPosts}
          activeIndex={activePostIndex}
          onNavigate={handleNavigate}
          onClose={closePostModal}
          profileUrl={instagramProfileUrl}
        />
      )}
    </>
  );
}
```

Apply same pattern to:
- `ReviewsShowcase.tsx` → `ReviewsModal`
- `Testimonials.tsx` → `TestimonialGalleryModal`, `TestimonialVideoModal`

**Expected Impact:**
- Initial JS reduction: -30 to -50KB
- TBT improvement: -100 to -200ms
- Faster interactive time

---

### 🟡 HIGH PRIORITY (Do Second)

#### Action 4: Convert SectionReveal to CSS-Only

**Goal:** Remove Framer Motion from all section entrance animations

**Current:** `ui/SectionReveal.tsx` uses Framer Motion  
**Problem:** Used by 8-10 sections, adds to bundle and hydration cost

**Solution:**

```tsx
// ui/SectionReveal.tsx (Convert to Server Component)
import { cn } from "@/lib/utils";

export function SectionReveal({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("section-reveal", className)}>
      {children}
    </div>
  );
}

// No "use client" needed
```

```css
/* globals.css */
@keyframes section-reveal {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-reveal {
  animation: section-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .section-reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* Stagger children if needed */
.section-reveal > * {
  animation-delay: inherit;
}
```

**Expected Impact:**
- Framer Motion only needed for Hero/modals
- Smaller initial bundle: -15 to -25KB
- Faster section rendering

---

#### Action 5: Lazy Load Below-Fold Carousels

**Goal:** Don't initialize marquees until scrolled into view

**Changes:**

```tsx
// components/instagram/InstagramMarqueeRow.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export function InstagramPostsMarqueeRow({ posts, onPostSelect, paused }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only trigger once
        }
      },
      { rootMargin: "200px 0px" } // Start loading 200px before visible
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  
  // Don't render expensive marquee until near viewport
  if (!isVisible) {
    return (
      <div ref={ref} className="instagram-marquee-placeholder min-h-[300px]" />
    );
  }
  
  return (
    <div ref={ref} className="instagram-marquee-row">
      {/* Existing marquee implementation */}
    </div>
  );
}
```

Apply same pattern to:
- `ReviewsMarqueeRow.tsx`
- `PartnerLogoStrip.tsx` (if heavy)

**Expected Impact:**
- Mobile: Don't load 20-40 images until scrolled near
- Better initial page load
- Reduced initial network congestion

---

#### Action 6: Convert Static Sections to Server Components

**Goal:** Reduce hydration overhead

**Candidates:**
- `WhyChooseUs.tsx` - Just displays features, no real interaction
- `Industries.tsx` - Just displays industry cards
- `Process.tsx` - Just displays process steps

**Pattern:**

```tsx
// components/WhyChooseUs.tsx (Server Component)
import { SectionReveal, SectionDivider } from "@/components/ui/SectionReveal";
import { Container } from "@/components/ui/Container";
import type { CMSFeature, SectionCopyContent } from "@/lib/cms/types";

type Props = {
  items: CMSFeature[];
  copy: SectionCopyContent;
};

export function WhyChooseUs({ items, copy }: Props) {
  return (
    <>
      <SectionDivider />
      <section className="relative py-16 sm:py-28 md:py-36">
        <Container>
          <SectionReveal className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold">
              {copy.heading}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {copy.subheading}
            </p>
          </SectionReveal>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div 
                key={item.id}
                className="feature-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

// Remove "use client"
// Remove Framer Motion imports
// Use CSS animations instead
```

**Expected Impact:**
- Reduced hydration time
- Less JavaScript execution
- Smaller initial bundle: -20 to -40KB

---

### 🟢 MEDIUM PRIORITY (Do Third)

#### Action 7: Optimize Hero Images for Mobile

**Goal:** Serve smaller hero images on mobile

**Current:** Full-size hero images (likely 1920x1080+)  
**Mobile Needs:** 1080x720 or smaller

**Changes:**

1. **Create mobile-optimized hero images during upload:**

```typescript
// lib/media/image-optimization.ts (NEW)
export async function createHeroVariants(originalPath: string) {
  return {
    desktop: originalPath, // 1920x1080
    mobile: await resizeImage(originalPath, { width: 1080, quality: 80 })
  };
}
```

2. **Use srcSet or conditional loading:**

```tsx
// components/HeroSlideshow.tsx
<Image
  src={isMobile ? slide.src.mobile : slide.src.desktop}
  alt={slide.alt}
  fill
  priority={i === 0}
  sizes="100vw"
  quality={i === 0 ? 75 : 60}
/>
```

**Expected Impact:**
- Mobile hero image size: -40% to -60%
- LCP improvement: -0.3 to -0.5s
- Bandwidth savings

---

#### Action 8: Implement Thumbnail Pipeline

**Goal:** Use thumbnails in marquees, full images in lightboxes

**Changes:**

1. **Generate thumbnails on upload:**

```typescript
// lib/media/thumbnails.ts (NEW)
export async function createThumbnail(
  originalPath: string,
  options: { width: number; quality: number }
) {
  // Use sharp or similar to resize
  const thumbPath = originalPath.replace(/(\.\w+)$/, '_thumb$1');
  await resizeImage(originalPath, thumbPath, options);
  return thumbPath;
}
```

2. **Store both in CMS:**

```typescript
// After upload
{
  id: "post-1",
  image: "/uploads/instagram/full-image.webp",
  thumbnail: "/uploads/instagram/full-image_thumb.webp", // NEW
  // ...
}
```

3. **Use thumbnail in marquee:**

```tsx
// components/instagram/InstagramMarqueeRow.tsx
<Image
  src={post.thumbnail || post.image}
  alt={alt}
  fill
  loading="lazy"
  sizes="(max-width: 640px) 180px, (max-width: 1024px) 250px, 290px"
/>
```

4. **Use full image in modal:**

```tsx
// components/instagram/InstagramShowcasePostModal.tsx
<Image
  src={post.image} // Full resolution
  alt={alt}
  fill
/>
```

**Expected Impact:**
- Marquee images: -60% to -80% file size
- Network requests complete faster
- Smoother scrolling

---

#### Action 9: Defer Non-Critical JavaScript

**Goal:** Load analytics, chat widgets, etc. after page is interactive

**Changes:**

```tsx
// app/layout.tsx
import { Suspense } from "react";
import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@/components/Analytics"),
  { ssr: false }
);

const ChatWidget = dynamic(
  () => import("@/components/ChatWidget"),
  { ssr: false }
);

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Load after page is interactive */}
        <Suspense fallback={null}>
          <Analytics />
          <ChatWidget />
        </Suspense>
      </body>
    </html>
  );
}
```

**Expected Impact:**
- TBT improvement: -50 to -100ms
- Faster time to interactive

---

## 6. EXPECTED RESULTS

### Before (Estimated Current State)

- **Performance Score:** 40-50
- **FCP:** 2.0-3.0s
- **LCP:** 3.5-5.0s
- **TBT:** 600-900ms
- **CLS:** 0.05-0.15
- **Total JS:** 1.2-1.5MB
- **Total Images:** 2-4MB (first load)
- **DOM Nodes:** 3000-5000

### After All Fixes (Target)

- **Performance Score:** 80-90 ✅
- **FCP:** 1.0-1.5s ✅
- **LCP:** 2.0-2.5s ✅
- **TBT:** 200-300ms ✅
- **CLS:** <0.1 ✅
- **Total JS:** 800KB-1.0MB ✅
- **Total Images:** 1.0-1.5MB (first load) ✅
- **DOM Nodes:** 2000-3000 ✅

### Component Impact Summary

| Change | JS Reduction | LCP Impact | TBT Impact |
|--------|--------------|------------|------------|
| Mobile Hero (no Framer) | -30KB | -1.0s | -150ms |
| Lazy Load Modals | -40KB | -0.2s | -200ms |
| Reduce Marquee Duplication | -20KB | -0.5s | -100ms |
| CSS-only SectionReveal | -20KB | -0.1s | -50ms |
| Convert to Server Components | -30KB | -0.3s | -100ms |
| Lazy Load Carousels | -15KB | -0.4s | -80ms |
| **Total** | **-155KB** | **-2.5s** | **-680ms** |

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Critical Mobile Fixes (2-3 hours)

- [ ] Create `HeroMobile.tsx` Server Component with CSS animations
- [ ] Add responsive Hero loading in `app/page.tsx`
- [ ] Update `lib/instagram/marquee.ts` with mobile parameter
- [ ] Add `useMediaQuery` hook for mobile detection
- [ ] Lazy load Instagram modal
- [ ] Lazy load Reviews modal
- [ ] Lazy load Testimonial modals
- [ ] Test mobile homepage loads correctly
- [ ] Verify no hydration errors

### Phase 2: Bundle Optimization (2-3 hours)

- [ ] Convert `SectionReveal.tsx` to Server Component with CSS
- [ ] Add CSS animations to `globals.css`
- [ ] Convert `WhyChooseUs.tsx` to Server Component
- [ ] Convert `Industries.tsx` to Server Component
- [ ] Convert `Process.tsx` to Server Component
- [ ] Remove "use client" from static sections
- [ ] Test all sections still render correctly
- [ ] Verify animations work with reduced motion

### Phase 3: Lazy Loading (1-2 hours)

- [ ] Add `IntersectionObserver` to `InstagramMarqueeRow.tsx`
- [ ] Add `IntersectionObserver` to `ReviewsMarqueeRow.tsx`
- [ ] Add placeholder skeletons for lazy-loaded sections
- [ ] Test marquees appear when scrolled into view
- [ ] Verify animations start correctly

### Phase 4: Image Optimization (3-4 hours)

- [ ] Implement thumbnail generation function
- [ ] Update upload API to create thumbnails
- [ ] Update Instagram Admin to store thumbnail URLs
- [ ] Update Reviews Admin to store thumbnail URLs
- [ ] Modify marquee components to use thumbnails
- [ ] Modify modals to use full images
- [ ] Test image quality is acceptable
- [ ] Document thumbnail migration for existing images

### Phase 5: Testing & Validation (2-3 hours)

- [ ] Run `npm run build` successfully
- [ ] Test on mobile device (375px, 390px, 430px)
- [ ] Run Lighthouse Mobile 3 times, record median
- [ ] Verify Performance >= 80
- [ ] Verify LCP <= 2.5s
- [ ] Verify CLS <= 0.1
- [ ] Verify no blank gaps
- [ ] Test desktop still works correctly
- [ ] Verify all modals open correctly
- [ ] Verify all marquees animate smoothly
- [ ] Check no console errors
- [ ] Verify CMS data unchanged

---

## 8. SAFETY NOTES

**DO NOT:**
- Modify CMS data
- Delete production images
- Touch PostgreSQL migration code
- Change desktop design
- Remove functionality
- Disable Next.js image optimization
- Use `overflow:hidden` to hide performance issues

**VERIFY:**
- No DYNAMIC_SERVER_USAGE errors
- No EACCES errors
- No hydration mismatches
- No layout shifts
- No broken images
- No broken animations on desktop

---

## 9. NEXT STEPS

1. **User Approval** - Review this diagnosis and approve action plan
2. **Implement Phase 1** - Critical mobile fixes first
3. **Measure Impact** - Run Lighthouse after Phase 1
4. **Iterate** - Continue to Phase 2 if targets not met
5. **Document** - Update performance report with actual metrics

---

## 10. QUESTIONS FOR USER

Before proceeding with fixes:

1. **Desktop Changes OK?** - Some changes (CSS animations) will affect desktop slightly. Is this acceptable?
2. **Hero Animations Priority?** - Should mobile have simple fade-in, or try to keep some word animation (lighter)?
3. **Thumbnail Quality** - What quality/size is acceptable for marquee thumbnails? (Suggested: 640px width, 75 quality)
4. **Rollout Strategy** - Test on staging first, or fix all issues then test together?

---

**STATUS:** Awaiting user approval to proceed with Phase 1 implementation.
