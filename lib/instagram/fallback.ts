import { INSTAGRAM_PROFILE_URL } from "./constants";

/** Verified permalinks from @_neonbright_ (public profile). */
export const FALLBACK_PERMALINKS: string[] = [
  `${INSTAGRAM_PROFILE_URL}p/DWuN0khjK88/`,
  `${INSTAGRAM_PROFILE_URL}p/DSFntNbDLoQ/`,
  `${INSTAGRAM_PROFILE_URL}p/DNbCtw7M97B/`,
  `${INSTAGRAM_PROFILE_URL}p/DJ4EPLzM-Hp/`,
  `${INSTAGRAM_PROFILE_URL}p/DHRPhTGunak/`,
  `${INSTAGRAM_PROFILE_URL}p/DEISxy1OueA/`,
  `${INSTAGRAM_PROFILE_URL}reel/DAgggskOhol/`,
  `${INSTAGRAM_PROFILE_URL}p/C_8X8KWoQ3y/`,
  `${INSTAGRAM_PROFILE_URL}p/C_bC_CtOB-O/`,
  `${INSTAGRAM_PROFILE_URL}reel/C_YTkZRIcVL/`,
];

export const FALLBACK_MIN_POSTS = 6;

function shortcodeFromPermalink(permalink: string): string | null {
  const match = permalink.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  return match?.[2] ?? null;
}

export function isReelPermalink(permalink: string): boolean {
  return permalink.includes("/reel/");
}

export function permalinkToPostId(permalink: string): string {
  return shortcodeFromPermalink(permalink) ?? permalink;
}
