import { createHmac, timingSafeEqual } from "crypto";

const SIG_HEADER = "x-hub-signature-256";
const SIG_PREFIX = "sha256=";

export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature?.startsWith(SIG_PREFIX)) return false;

  const expected = signature.slice(SIG_PREFIX.length);
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const digest = hmac.digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const digestBuf = Buffer.from(digest, "hex");
    return expectedBuf.length === digestBuf.length && timingSafeEqual(expectedBuf, digestBuf);
  } catch {
    return false;
  }
}

export type PushCommit = {
  id: string;
  message: string;
  author: { name: string; email: string };
  url: string;
  added?: string[];
  modified?: string[];
  removed?: string[];
};

export type PushPayload = {
  ref: string;
  repository: {
    id: number;
    full_name: string;
    name: string;
  };
  commits: PushCommit[];
  head_commit: PushCommit | null;
};

export function parsePushPayload(body: unknown): PushPayload | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as Record<string, unknown>;
  if (payload.repository && typeof payload.repository === "object") {
    const repo = payload.repository as Record<string, unknown>;
    const commits = Array.isArray(payload.commits)
      ? (payload.commits as Array<Record<string, unknown>>).map((c) => {
          const arr = (x: unknown) =>
            Array.isArray(x) ? (x as string[]).filter((v) => typeof v === "string") : [];
          return {
            id: String(c.id ?? c.sha ?? ""),
            message: String(c.message ?? ""),
            author:
              c.author && typeof c.author === "object"
                ? {
                    name: String((c.author as Record<string, unknown>).name ?? ""),
                    email: String((c.author as Record<string, unknown>).email ?? ""),
                  }
                : { name: "", email: "" },
            url: String(c.url ?? ""),
            added: arr(c.added),
            modified: arr(c.modified),
            removed: arr(c.removed),
          };
        })
      : [];

    const headCommit = payload.head_commit && typeof payload.head_commit === "object"
      ? (payload.head_commit as Record<string, unknown>)
      : null;
    const headArr = (x: unknown) =>
      Array.isArray(x) ? (x as string[]).filter((v) => typeof v === "string") : [];

    return {
      ref: String(payload.ref ?? ""),
      repository: {
        id: Number(repo.id ?? 0),
        full_name: String(repo.full_name ?? ""),
        name: String(repo.name ?? ""),
      },
      commits,
      head_commit: headCommit
        ? {
            id: String(headCommit.id ?? headCommit.sha ?? ""),
            message: String(headCommit.message ?? ""),
            author:
              headCommit.author && typeof headCommit.author === "object"
                ? {
                    name: String((headCommit.author as Record<string, unknown>).name ?? ""),
                    email: String((headCommit.author as Record<string, unknown>).email ?? ""),
                  }
                : { name: "", email: "" },
            url: String(headCommit.url ?? ""),
            added: headArr(headCommit.added),
            modified: headArr(headCommit.modified),
            removed: headArr(headCommit.removed),
          }
        : null,
    };
  }

  return null;
}
