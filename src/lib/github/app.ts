import jwt from "jsonwebtoken";

const GITHUB_API = "https://api.github.com";

export function getGitHubAppJwt(): string {
  const appId = process.env.GITHUB_APP_ID;
  let privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const token = getGitHubAppJwt();

  const res = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

export type GitHubRepo = {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
};

async function fetchRepoPage(
  token: string,
  page: number,
  perPage: number
): Promise<{ repositories: GitHubRepo[]; total_count: number }> {
  const res = await fetch(
    `${GITHUB_API}/installation/repositories?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }

  return res.json() as Promise<{ total_count: number; repositories: GitHubRepo[] }>;
}

/**
 * Fetches all installation repos across every GitHub page in parallel,
 * then sorts the full set by updated_at so ordering is globally correct.
 */
async function fetchAllInstallationRepos(
  installationId: number
): Promise<{ repositories: GitHubRepo[]; total_count: number }> {
  const token = await getInstallationToken(installationId);

  // GitHub allows max 100 per page — use it to minimise round trips
  const BATCH_SIZE = 100;

  const first = await fetchRepoPage(token, 1, BATCH_SIZE);
  const totalCount = first.total_count;
  const totalPages = Math.ceil(totalCount / BATCH_SIZE);

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const rest = await Promise.all(
    remainingPages.map((p) => fetchRepoPage(token, p, BATCH_SIZE))
  );

  const all = [
    ...first.repositories,
    ...rest.flatMap((r) => r.repositories),
  ].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return { repositories: all, total_count: totalCount };
}

export async function listInstallationRepos(
  installationId: number,
  page: number = 1,
  perPage: number = 30
): Promise<{ repositories: GitHubRepo[]; total_count: number }> {
  const { repositories, total_count } = await fetchAllInstallationRepos(installationId);

  const start = (page - 1) * perPage;
  return {
    repositories: repositories.slice(start, start + perPage),
    total_count,
  };
}

export type CommitFile = {
  filename: string;
  status: string;
  patch: string | null;
  additions: number;
  deletions: number;
};

export async function fetchCommitDiff(
  repoFullName: string,
  installationId: number,
  sha: string
): Promise<{ message: string; files: CommitFile[] } | null> {
  const [owner, repo] = repoFullName.split("/", 2);
  if (!owner || !repo) return null;

  const token = await getInstallationToken(installationId);
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${sha}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    commit?: { message?: string };
    files?: Array<{
      filename?: string;
      status?: string;
      patch?: string | null;
      additions?: number;
      deletions?: number;
    }>;
  };

  const files: CommitFile[] = (data.files ?? []).map((f) => ({
    filename: f.filename ?? "",
    status: f.status ?? "modified",
    patch: f.patch ?? null,
    additions: f.additions ?? 0,
    deletions: f.deletions ?? 0,
  }));

  return {
    message: data.commit?.message ?? "",
    files,
  };
}

export function getGitHubAppInstallUrl(): string {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) {
    throw new Error("GITHUB_APP_SLUG must be set (e.g. commitly or your-app-name)");
  }
  return `https://github.com/apps/${slug}/installations/new`;
}

export type RepoTreeEntry = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

/**
 * Fetches the full recursive file tree for a repo at a given SHA.
 * Returns only blob (file) entries, filtered to indexable extensions,
 * excluding common non-source paths and files over 50KB.
 */
export async function fetchRepoTree(
  repoFullName: string,
  installationId: number,
  sha: string
): Promise<RepoTreeEntry[]> {
  const [owner, repo] = repoFullName.split("/", 2);
  if (!owner || !repo) return [];

  const token = await getInstallationToken(installationId);
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${sha}?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    tree?: Array<{ path?: string; type?: string; size?: number }>;
  };

  const INDEXABLE_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".go", ".rs", ".java", ".rb", ".php",
    ".md", ".mdx",
  ]);

  const EXCLUDED_PATTERNS = [
    /^node_modules\//,
    /^\.next\//,
    /^dist\//,
    /^build\//,
    /^out\//,
    /^\.git\//,
    /^coverage\//,
    /\.lock$/,
    /\.d\.ts$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.min\.js$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
  ];

  const MAX_FILE_SIZE = 50 * 1024; // 50KB

  return (data.tree ?? [])
    .filter((entry) => {
      if (entry.type !== "blob" || !entry.path) return false;
      if (entry.size && entry.size > MAX_FILE_SIZE) return false;
      if (EXCLUDED_PATTERNS.some((p) => p.test(entry.path!))) return false;
      const ext = entry.path.slice(entry.path.lastIndexOf("."));
      return INDEXABLE_EXTENSIONS.has(ext);
    })
    .map((entry) => ({
      path: entry.path!,
      type: "blob" as const,
      size: entry.size,
    }));
}

/**
 * Fetches the raw text content of a single file from GitHub at a specific ref.
 * Returns null on any error (missing file, binary content, API failure).
 */
export async function fetchFileContent(
  repoFullName: string,
  installationId: number,
  filePath: string,
  ref: string
): Promise<string | null> {
  const [owner, repo] = repoFullName.split("/", 2);
  if (!owner || !repo) return null;

  const token = await getInstallationToken(installationId);
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { encoding?: string; content?: string };

  if (data.encoding !== "base64" || !data.content) return null;

  try {
    const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
    // Strip characters that break JSON serialization (null bytes, lone surrogates).
    // Inngest serializes step return values as JSON; invalid Unicode causes
    // "unsupported Unicode escape sequence" errors in the embed-chunks step.
    return decoded
      .replace(/\0/g, "")                    // null bytes
      .replace(/[\uD800-\uDFFF]/g, "")       // lone surrogate halves (invalid Unicode)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // non-printable control chars
  } catch {
    return null;
  }
}
