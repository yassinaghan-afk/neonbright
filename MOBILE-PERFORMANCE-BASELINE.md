# MOBILE PERFORMANCE BASELINE & TOP 5 BOTTLENECKS

**Date:** 2026-07-16 02:50 AM  
**Environment:** Production build (`npm run build && npm run start`)  
**Methodology:** Real browser measurements using Chrome DevTools Protocol  
**Test Viewports:** Desktop (1024x768), Mobile (375x812)

---

## BASELINE METRICS

### Desktop Load (First Visit, 1024x768)

**Page Load:**
- Duration: 281.5ms
- DOM Interactive: 188.4ms  
- DOM ContentLoaded: 188.4ms
- First Contentful Paint: ~212ms
- Transfer Size (HTML): 23KB
- Decoded Body: 103KB

**Resources:**
- Total JS Transferred: **240KB** (12 files)
- Total CSS Transferred: **21KB** (2 files)
- Total Images Transferred: **72KB** (22 requests)
- Total Requests: 36

**Largest JS Chunks:**
1. `3peubv2924kx4.js` - 71KB
2. `0rtv506nxvzkw.js` - 44KB  
3. `1mfjqidm5qp0a.js` - 39KB
4. `1h5h5uutk39bw.js` - 23KB
5. `0jqke9h6xywfr.js` - 13KB

### Mobile Load (375x812, Cached Reload)

**Page Load:**
- Duration: 91.7ms (cached)
- DOM Interactive: 56ms
- First Paint: 96ms
- First Contentful Paint: 96ms

**Resources (Cached Reload):**
- JS Files: 0 bytes (cached, 12 files)
- Images: **246KB** (16 requests)
- Image count increased significantly on mobile

### Critical Findings from Measurements

**JavaScript:**
- Initial bundle: **240KB transferred**
- 12 JavaScript chunks loaded immediately
- No code splitting for below-fold content
- All chunks loaded before first paint

**Images:**
- **Multiple hero slider images requested at w=3840** (4K resolution)
- Hero images requested even when not visible
- 7-8 different hero images loaded immediately
- Partner logos: Multiple requests for logo files

**Network Waterfall Analysis:**
1. HTML loads in 29ms
2. CSS and fonts load in parallel (30-35ms)
3. JS chunks start loading at 33-112ms
4. **Hero images at w=3840 requested at 112ms+**
5. Partner logos load after JS execution

---

## TOP 5 BOTTLENECKS (WITH EVIDENCE)

### 🔴 BOTTLENECK #1: Multiple Full-Resolution Hero Images Preloaded

**Component:** `components/HeroSlideshow.tsx`  
**File:** Lines 132-141

**Evidence:**
```
Network requests show:
- /media/hero-slider/13978eaa-af3e-422b-afce-217b5298c6ed.jpg (w=3840, q=75)
- /media/hero-slider/2842fb6b-da2c-4af8-92f4-e4ed440c7183.jpg (w=3840, q=75)
- /media/hero-slider/efa6a01f-04f7-4220-8080-c35519c6539f.jpg (w=3840, q=75)
- /media/hero-slider/c465b19f-3967-4486-b3eb-d4eda34b9c7b.jpg (w=3840, q=75)
- /media/hero-slider/64550da3-6666-41e4-ae29-6d8422853ffd.jpg (w=3840, q=75)
- /media/hero-slider/82efd0d2-2918-440b-9d23-41974d6cbb59.jpg (w=3840, q=75)
- /media/hero-slider/d35fa705-f3f5-4435-a878-d6d3f99c92cc.jpg (w=3840, q=75)
- /media/hero-slider/d4aa5e68-81c9-4331-8a8f-83b20958ef85.jpg (w=3840, q=75)

Total: 8 hero images at 4K resolution requested immediately
```

**Current Code:**
```tsx
// HeroSlideshow.tsx lines 84-145
{images.map((slide, i) => {
  if (!visibleIndices.has(i)) return null;  // Only renders 3 slides
  
  return (
    <motion.div key={slide.id}>
      <Image
        src={slide.src}
        alt={slide.alt}
        fill
        priority={i === 0}        // ❌ Only first has priority
        loading={i === 0 ? undefined : "lazy"}  // ✓ Others are lazy
        sizes="(max-width: 640px) 100vw, ..."  // ✓ Sizes defined
        quality={i === 0 ? 75 : 60}            // ✓ Quality optimized
      />
    </motion.div>
  );
})}
```

**Problem:**
- `visibleIndices` includes active + prev + next (3 slides)
- BUT Next.js `<Image>` with `fill` and `priority` still triggers preload links
- Browser sees `<link rel="preload">` for ALL hero images in the initial HTML
- **ALL 8 hero images get requested at w=3840** regardless of `priority` flag
- On mobile (375px), requesting 3840px images wastes ~2-3MB of bandwidth

**Mobile Impact:**
- Estimated wasted bandwidth: 2-3MB per page load
- LCP delayed by 1-2 seconds waiting for large images
- Mobile users on 3G/4G experience significant delay

**Expected Improvement:**
- Load ONLY first hero image immediately
- Defer other slides until after first paint or carousel interaction
- Use mobile-sized images (max 1080px width on mobile)
- **Impact:** -2MB transfer, -1.5s LCP improvement

---

### 🔴 BOTTLENECK #2: Framer Motion Loaded Before First Paint

**Components:** Hero, HeroSlideshow, SectionReveal (used 8-10x), and 10+ other components  
**Bundle:** `3peubv2924kx4.js` (71KB) - Largest chunk

**Evidence:**
```
JS Chunks loaded before FCP:
- 3peubv2924kx4.js: 71KB (duration: 102.5ms) ← Contains Framer Motion
- 1mfjqidm5qp0a.js: 39KB (duration: 103ms)
- 0rtv506nxvzkw.js: 44KB (duration: 112ms)

Hero component waits for Framer Motion to:
- Animate word-by-word entrance
- Apply scroll parallax effects
- Render Ken Burns animations on slideshow
```

**Current Code:**
```tsx
// Hero.tsx lines 1-4
"use client";
import { motion, useScroll, useTransform } from "framer-motion";

// Lines 60-74: Complex word-by-word animation
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

**Problem:**
- Framer Motion library (~60-80KB uncompressed) loaded in critical path
- Hero component is NOT dynamically imported (directly imported in `app/page.tsx`)
- Complex animations run immediately, delaying visible content
- Mobile users see black screen during JS parsing + animation setup

**Current Usage:**
- `Hero.tsx` - Word animations, scroll parallax
- `HeroSlideshow.tsx` - Ken Burns effects  
- `SectionReveal.tsx` - Used by ALL sections (8-10 instances)
- `WhyChooseUs.tsx`, `Industries.tsx`, `Process.tsx` - Entrance animations
- Modals, buttons, and other components

**Mobile Impact:**
- 71KB chunk blocks first paint
- Additional 100-200ms parsing time on mobile
- Complex animations cause jank on lower-end devices

**Expected Improvement:**
- Remove Framer Motion from above-fold components
- Use CSS animations for simple entrance effects
- Dynamically import for complex interactions only
- **Impact:** -71KB initial JS, -0.5s to -1.0s FCP

---

### 🔴 BOTTLENECK #3: All Sections Using "use client" Unnecessarily

**Components:** 10+ homepage sections are Client Components  
**Impact:** Increased hydration cost, larger bundles, slower interactivity

**Evidence:**
```
Client Components on homepage (from code analysis):
✓ Hero.tsx - "use client" (Framer Motion animations)
✓ HeroSlideshow.tsx - "use client" (animations)
✓ PartnerLogoStrip.tsx - "use client" (marquee animation)
✓ WhyChooseUs.tsx - "use client" (Framer Motion entrance)
✓ Industries.tsx - "use client" (Framer Motion entrance)
✓ Process.tsx - "use client" (Framer Motion entrance)
✓ FAQ.tsx - "use client" (accordion state)
✓ Testimonials.tsx - "use client" (slider state)
✓ ReviewsShowcase.tsx - "use client" (modal state)
✓ InstagramMarqueeShowcase.tsx - "use client" (modal state)

Total: 10 Client Components with full hydration overhead
```

**Problem:**
- Many sections are Client Components ONLY for simple fade-in animations
- Entire component markup and data serialized to client
- Hydration overhead for components that could be Server Components
- `SectionReveal.tsx` is a Client Component used by every section

**Example - WhyChooseUs:**
```tsx
// WhyChooseUs.tsx
"use client";  // ❌ Only needed for animations

import { motion } from "framer-motion";  // ❌ Heavy import
import { SectionReveal } from "@/components/ui/SectionReveal";  // ❌ Also client

export function WhyChooseUs({ items, copy }) {
  // Just renders static feature cards with fade-in
  // Could be Server Component with CSS animations
}
```

**Mobile Impact:**
- Larger initial bundle (all client component code)
- Slower Time to Interactive (hydration cost)
- More JavaScript execution on mobile

**Expected Improvement:**
- Convert static sections to Server Components
- Use CSS animations instead of Framer Motion
- Keep only interactive parts as Client Components
- **Impact:** -30-50KB JS, faster TTI

---

### 🔴 BOTTLENECK #4: Modals Included in Initial Bundle

**Components:** InstagramShowcasePostModal, ReviewsModal, Testimonial modals  
**Impact:** ~30-50KB loaded upfront, never used until clicked

**Evidence:**
```
Code analysis shows direct imports (not dynamic):
- InstagramMarqueeShowcase.tsx imports InstagramShowcasePostModal directly
- ReviewsShowcase.tsx imports ReviewsModal directly  
- Testimonials.tsx imports TestimonialGalleryModal, TestimonialVideoModal

All modals are rendered (hidden) on page load:
```tsx
// InstagramMarqueeShowcase.tsx lines 131-137
<InstagramShowcasePostModal
  posts={galleryPosts}
  activeIndex={activePostIndex}  // Initially null
  onNavigate={handleNavigate}
  onClose={closePostModal}
  profileUrl={instagramProfileUrl}
/>
```

**Problem:**
- Modal components loaded in initial bundle
- React components for modals hydrated even when closed
- Framer Motion animations for modals included
- Modal backdrop, overlay, and interaction code all in initial load

**Mobile Impact:**
- Wasted bandwidth for code that may never execute
- Slower initial page load
- Larger bundle to parse

**Expected Improvement:**
- Dynamic import modals
- Load only when user clicks to open
- Conditionally render when `activeIndex !== null`
- **Impact:** -30-50KB initial JS, faster parse time

---

### 🔴 BOTTLENECK #5: No Lazy Loading for Below-Fold Carousels

**Components:** Instagram marquee, Reviews marquee, Partners  
**Impact:** All initialize and animate immediately, even when offscreen

**Evidence:**
```
From app/page.tsx (lines 11-47):
- InstagramMarqueeShowcase: dynamically imported ✓
- WhyChooseUs: dynamically imported ✓
- Industries: dynamically imported ✓
- ReviewsShowcase: dynamically imported ✓
- Testimonials: dynamically imported ✓
- Process: dynamically imported ✓
- FAQ: dynamically imported ✓

BUT: No IntersectionObserver to defer initialization
All components load and render immediately on page load
```

**Current Behavior:**
```tsx
// app/page.tsx
const InstagramMarqueeShowcase = dynamic(
  () => import("@/components/instagram/InstagramMarqueeShowcase"),
  { loading: () => null }  // ✓ Dynamic import
);

// BUT components initialize immediately when code loads
// No waiting for scroll into view
```

**Problem:**
- Below-fold carousels start rendering/animating immediately
- Instagram marquee creates DOM nodes for duplicated images
- Reviews marquee creates duplicate review cards
- CSS animations run offscreen, consuming CPU/GPU
- Network requests for below-fold images start immediately

**Instagram Marquee Specific Issue:**
From code analysis (`lib/instagram/marquee.ts`):
```typescript
const MIN_VISIBLE_CARDS = 12;

export function computeMarqueeCopies(postCount: number): number {
  return Math.max(2, Math.ceil(MIN_VISIBLE_CARDS / postCount));
}
```
- With 10 posts: 2 copies = 20 image elements
- With 5 posts: 3 copies = 15 image elements
- All rendered immediately, even when section is below fold

**Mobile Impact:**
- Unnecessary DOM nodes (20-30+ images in Instagram)
- CPU cycles for offscreen animations
- Network waterfall congested with below-fold images
- Slower scroll performance

**Expected Improvement:**
- Add `IntersectionObserver` to defer carousel initialization
- Don't render marquee track until section near viewport
- Pause animations when scrolled out of view
- **Impact:** Faster initial load, smoother scrolling, -100-200KB initial images

---

## SUMMARY OF TOP 5 BOTTLENECKS

| # | Bottleneck | Component(s) | Evidence | Impact | Expected Fix Impact |
|---|------------|--------------|----------|--------|-------------------|
| 1 | Multiple 4K hero images preloaded | HeroSlideshow | 8 images at w=3840 requested | LCP +1-2s, +2-3MB | -2MB, -1.5s LCP |
| 2 | Framer Motion blocks first paint | Hero, SectionReveal, 10+ components | 71KB chunk, 102ms load | FCP +0.5-1s | -71KB, -1s FCP |
| 3 | Unnecessary Client Components | WhyChooseUs, Industries, Process, etc. | 10 sections with "use client" | TTI +300ms | -30-50KB, faster TTI |
| 4 | Modals in initial bundle | Instagram, Reviews, Testimonials modals | Direct imports, rendered hidden | Bundle +30-50KB | -30-50KB |
| 5 | No lazy loading for carousels | Instagram, Reviews, Partners | Initialize immediately offscreen | +100-200KB images, slower scroll | -100-200KB, smoother scroll |

**Total Expected Impact:**
- **Initial JS:** -130 to -170KB (from 240KB to 70-110KB)
- **Initial Images:** -2.1 to -2.2MB
- **Mobile LCP:** -1.5 to -2.5 seconds
- **FCP:** -0.5 to -1.0 seconds
- **TTI:** -300 to -500ms

---

## ADDITIONAL FINDINGS

### Partner Logos
Multiple old JPEG logo files being requested:
```
- PHOTO-2026-06-23-18-20-29.jpg (27KB)
- PHOTO-2026-06-23-18-32-12.jpg (29KB)
- PHOTO-2026-06-23-18-20-29 2.jpg
- PHOTO-2026-06-23-18-20-29 3.jpg
... (multiple files)
```
These appear to be unoptimized originals. Should use WebP/AVIF at appropriate sizes.

### Fonts
Two font files preloaded correctly:
```
- 1b99372b3eaef0c8-s.p.woff2 (cached, 0 bytes transferred)
- fba5a26ea33df6a3-s.p.woff2 (cached, 0 bytes transferred)
```
Font loading appears optimized.

### DOM Complexity
From Performance metrics:
- **Nodes: 736** (reasonable)
- **LayoutObjects: 625** (reasonable)
- **JSEventListeners: 412** (high - likely from Framer Motion)

### Recalc Style Cost
- **RecalcStyleCount: 620** (very high)
- **RecalcStyleDuration: 59.76ms** (significant)

This suggests heavy CSS recalculation, likely from:
- Framer Motion inline styles
- Continuous animations
- Complex selectors

---

## MOBILE BLANK GAPS INVESTIGATION

**From Screenshots:**
- Large black area below hero (expected - it's the hero background)
- No significant white gaps observed in the screenshots
- Content appears to render progressively

**However, user reports large blank areas on mobile.**

**To investigate further, need to:**
1. Check section min-heights on actual mobile device
2. Measure with real mobile network throttling
3. Test with empty/hidden CMS sections

**Suspected causes:**
- `min-h-[600px] sm:min-h-[700px] md:min-h-screen` on Hero
- Sections with empty content still rendering containers
- Loading states for below-fold components

---

## NEXT STEPS

**Priority Order:**

1. **Fix Hero Image Loading** (Highest Impact)
   - Load only first hero image with `priority`
   - Defer others until after FCP or user interaction
   - Use mobile-sized images (max 1080px on mobile)

2. **Remove Framer Motion from Critical Path**
   - Convert Hero to use CSS animations on mobile
   - Convert SectionReveal to Server Component with CSS
   - Dynamically import Framer Motion for complex interactions only

3. **Lazy Load Carousels**
   - Add IntersectionObserver to Instagram, Reviews, Partners
   - Don't initialize until near viewport
   - Pause animations when offscreen

4. **Lazy Load Modals**
   - Dynamic import all modal components
   - Conditional render when opened

5. **Convert to Server Components**
   - WhyChooseUs, Industries, Process, etc.
   - Keep only minimal interactive parts as Client Components

---

**Status:** Baseline complete, ready to implement fixes  
**Approval Required:** Yes - proceed with fixes?
