type BlobCommandOptions = {
  token?: string;
  oidcToken?: string;
  storeId?: string;
};

export class BlobNotConfiguredError extends Error {
  constructor() {
    super(
      "Blob storage is not configured. Connect a Blob store to this Vercel project (BLOB_STORE_ID + OIDC) or set BLOB_READ_WRITE_TOKEN."
    );
    this.name = "BlobNotConfiguredError";
  }
}

type BlobAuth =
  | { mode: "oidc"; oidcToken: string; storeId: string }
  | { mode: "token"; token: string };

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** True when Blob credentials are present in the environment. */
export function hasBlobCredentials(): boolean {
  return Boolean(readEnv("BLOB_STORE_ID") || readEnv("BLOB_READ_WRITE_TOKEN"));
}

/** Use Vercel Blob on deployments when a store or token is linked. */
export function shouldUseBlobStorage(): boolean {
  return Boolean(process.env.VERCEL && hasBlobCredentials());
}

async function readOidcTokenFromRequest(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers");
    const value = (await headers()).get("x-vercel-oidc-token");
    if (value?.trim()) return value.trim();
  } catch {
    /* not in a Next.js request context */
  }
  return undefined;
}

async function resolveOidcToken(): Promise<string | undefined> {
  const fromRequest = await readOidcTokenFromRequest();
  if (fromRequest) return fromRequest;

  const fromEnv = readEnv("VERCEL_OIDC_TOKEN");
  if (fromEnv) return fromEnv;

  try {
    const { getVercelOidcToken } = await import("@vercel/oidc");
    const token = (await getVercelOidcToken()).trim();
    return token || undefined;
  } catch (err) {
    console.error(
      "[blob-client] OIDC token unavailable:",
      err instanceof Error ? err.stack ?? err.message : err
    );
    return undefined;
  }
}

/** Resolve Blob auth: OIDC + store id (modern) or read-write token (legacy). */
export async function resolveBlobAuth(): Promise<BlobAuth> {
  const storeId = readEnv("BLOB_STORE_ID");
  const readWrite = readEnv("BLOB_READ_WRITE_TOKEN");

  if (storeId) {
    const oidcToken = await resolveOidcToken();
    if (oidcToken) {
      return { mode: "oidc", oidcToken, storeId };
    }
    console.error(
      "[blob-client] BLOB_STORE_ID is set but no OIDC token is available (check store connection and redeploy)"
    );
  }

  if (readWrite) {
    return { mode: "token", token: readWrite };
  }

  throw new BlobNotConfiguredError();
}

export async function getBlobCommandOptions(): Promise<BlobCommandOptions> {
  const auth = await resolveBlobAuth();
  if (auth.mode === "oidc") {
    return { oidcToken: auth.oidcToken, storeId: auth.storeId };
  }
  return { token: auth.token };
}
