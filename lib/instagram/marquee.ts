/**
 * Seamless Instagram marquee helpers.
 * Track duplication is for animation only — never written into CMS.
 */

/** Minimum number of visual cards that should fill ~2 viewports. */
const MIN_VISIBLE_CARDS = 12;

/**
 * How many times to repeat the original post set so the animated track
 * is always wider than twice the viewport (no empty black gap).
 */
export function computeMarqueeCopies(
  postCount: number,
  viewportWidth = 0,
  setWidth = 0
): number {
  if (postCount <= 0) return 0;

  // Prefer measured geometry when available.
  if (viewportWidth > 0 && setWidth > 0) {
    const minTrack = Math.max(viewportWidth * 2, setWidth * 2);
    return Math.max(2, Math.ceil(minTrack / setWidth));
  }

  // SSR / first paint fallback: enough cards to fill a wide desktop.
  return Math.max(2, Math.ceil(MIN_VISIBLE_CARDS / postCount));
}

/** Duplicate the post list `copies` times for the animation track only. */
export function buildMarqueeTrack<T>(items: T[], copies: number): T[] {
  if (items.length === 0 || copies <= 0) return [];
  const out: T[] = [];
  for (let i = 0; i < copies; i++) {
    out.push(...items);
  }
  return out;
}
