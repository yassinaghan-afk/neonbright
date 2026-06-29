type BlobCommandOptions = {
  token?: string;
  oidcToken?: string;
  storeId?: string;
};

export class BlobNotConfiguredError extends Error {
  constructor(detail?: string) {
    super(
      detail ??
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

function readOidcTokenFromRequest(request?: Request): string | undefined {
  return request?.headers.get("x-vercel-oidc-token")?.trim() || undefined;
}

async function resolveOidcToken(request?: Request): Promise<string | undefined> {
  const fromRequest = readOidcTokenFromRequest(request);
  if (fromRequest) return fromRequest;

  try {
    const { headers } = await import("next/headers");
    const value = (await headers()).get("x-vercel-oidc-token");
    if (value?.trim()) return value.trim();
  } catch {
    /* not in a Next.js request context */
  }

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
export async function resolveBlobAuth(request?: Request): Promise<BlobAuth> {
  const storeId = readEnv("BLOB_STORE_ID");
  const readWrite = readEnv("BLOB_READ_WRITE_TOKEN");

  if (storeId) {
    const oidcToken = await resolveOidcToken(request);
    if (oidcToken) {
      return { mode: "oidc", oidcToken, storeId };
    }
    console.error(
      "[blob-client] BLOB_STORE_ID is set but x-vercel-oidc-token / VERCEL_OIDC_TOKEN is missing"
    );
  }

  if (readWrite) {
    return { mode: "token", token: readWrite };
  }

  const missing = [
    !storeId ? "BLOB_STORE_ID" : null,
    !readWrite ? "BLOB_READ_WRITE_TOKEN" : null,
    storeId ? "x-vercel-oidc-token" : null,
  ]
    .filter(Boolean)
    .join(", ");

  throw new BlobNotConfiguredError(
    `Blob credentials incomplete (missing: ${missing}). Redeploy after connecting the Blob store, or add BLOB_READ_WRITE_TOKEN.`
  );
}

export async function getBlobCommandOptions(
  request?: Request
): Promise<BlobCommandOptions> {
  const auth = await resolveBlobAuth(request);
  if (auth.mode === "oidc") {
    return { oidcToken: auth.oidcToken, storeId: auth.storeId };
  }
  return { token: auth.token };
}
