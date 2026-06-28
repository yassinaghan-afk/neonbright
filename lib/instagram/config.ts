import { INSTAGRAM_USERNAME } from "./constants";

const GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION?.trim() || "v21.0";

export type InstagramApiConfig = {
  accessToken: string;
  userId: string;
  graphVersion: string;
};

export function getInstagramGraphVersion(): string {
  return GRAPH_VERSION;
}

export function getInstagramAccessToken(): string | null {
  return process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || null;
}

export function getInstagramUserId(): string | null {
  return process.env.INSTAGRAM_USER_ID?.trim() || null;
}

export function getFacebookPageId(): string | null {
  return process.env.FACEBOOK_PAGE_ID?.trim() || null;
}

export function isInstagramApiConfigured(): boolean {
  const token = getInstagramAccessToken();
  if (!token) return false;
  return Boolean(getInstagramUserId() || getFacebookPageId());
}

async function fetchUserIdFromPage(
  pageId: string,
  accessToken: string
): Promise<string | null> {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}`
  );
  url.searchParams.set("fields", "instagram_business_account");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = (await res.json()) as {
    instagram_business_account?: { id: string };
    error?: { message: string };
  };

  if (!res.ok || json.error) {
    console.error(
      "[instagram] Failed to resolve IG user from page:",
      json.error?.message ?? res.status
    );
    return null;
  }

  return json.instagram_business_account?.id ?? null;
}

/** Resolves the Instagram Business account ID from env (direct or via Facebook Page). */
export async function resolveInstagramUserId(
  accessToken: string
): Promise<string | null> {
  const direct = getInstagramUserId();
  if (direct) return direct;

  const pageId = getFacebookPageId();
  if (!pageId) {
    console.warn(
      `[instagram] Set INSTAGRAM_USER_ID or FACEBOOK_PAGE_ID for @${INSTAGRAM_USERNAME}`
    );
    return null;
  }

  return fetchUserIdFromPage(pageId, accessToken);
}
