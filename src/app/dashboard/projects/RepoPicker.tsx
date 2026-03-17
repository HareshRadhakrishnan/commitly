"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectRepo, disconnectRepo } from "../actions";
import { Search, Link2, Unlink, Loader2 } from "lucide-react";

type Repo = {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  html_url: string;
};

type ConnectedProject = { id: string; github_repo_id: number };

type RepoPickerProps = {
  hasInstallation: boolean;
  connectedProjects: ConnectedProject[];
};

export function RepoPicker({
  hasInstallation,
  connectedProjects,
}: RepoPickerProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [localConnected, setLocalConnected] = useState<Set<number>>(
    () => new Set(connectedProjects.map((p) => p.github_repo_id))
  );
  const router = useRouter();

  useEffect(() => {
    if (!hasInstallation) return;
    setLoading(true);
    fetch(`/api/github/repos?page=${page}&per_page=30`)
      .then((res) => res.json())
      .then((data) => {
        setRepos(data.repositories ?? []);
        setTotalCount(data.total_count ?? 0);
      })
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [hasInstallation, page]);

  const filteredRepos = search.trim()
    ? repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : repos;

  const getProjectForRepo = (repoId: number) =>
    connectedProjects.find((p) => p.github_repo_id === repoId);
  const isConnected = (repoId: number) =>
    localConnected.has(repoId) || !!getProjectForRepo(repoId);

  async function handleConnect(repo: Repo) {
    setActionLoading(repo.id);
    try {
      await connectRepo(repo.id, repo.full_name);
      setLocalConnected((s) => new Set(s).add(repo.id));
      router.refresh();
    } catch {
      // Error handled by caller
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(repo: Repo) {
    const project = getProjectForRepo(repo.id);
    if (!project) return;
    setActionLoading(repo.id);
    try {
      await disconnectRepo(project.id);
      setLocalConnected((s) => {
        const next = new Set(s);
        next.delete(repo.id);
        return next;
      });
      router.refresh();
    } catch {
      // Error handled by caller
    } finally {
      setActionLoading(null);
    }
  }

  if (!hasInstallation) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 py-2 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading repositories…
        </div>
      ) : filteredRepos.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No repositories found
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          {filteredRepos.map((repo) => {
            const connected = isConnected(repo.id);
            const busy = actionLoading === repo.id;

            return (
              <li
                key={repo.id}
                className="flex items-center justify-between gap-4 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {repo.full_name}
                  </a>
                  {repo.description && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {repo.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    connected ? handleDisconnect(repo) : handleConnect(repo)
                  }
                  disabled={busy}
                  className={`
                    flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
                    ${
                      connected
                        ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                    }
                  `}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : connected ? (
                    <>
                      <Unlink className="h-4 w-4" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Connect
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalCount > 30 && (
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-50 dark:text-zinc-400"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {Math.ceil(totalCount / 30)}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / 30)}
            className="rounded px-3 py-1.5 text-sm text-zinc-600 disabled:opacity-50 dark:text-zinc-400"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
