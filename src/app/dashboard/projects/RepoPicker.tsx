"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { connectRepo, disconnectRepo } from "../actions";
import { Search, Link2, Unlink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2 rounded-lg border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No repositories found
        </p>
      ) : (
        <ul className="max-h-80 space-y-0 overflow-y-auto rounded-lg border">
          {filteredRepos.map((repo) => {
            const connected = isConnected(repo.id);
            const busy = actionLoading === repo.id;

            return (
              <li
                key={repo.id}
                className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:underline"
                  >
                    {repo.full_name}
                  </a>
                  {repo.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {repo.description}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={connected ? "secondary" : "default"}
                  onClick={() =>
                    connected ? handleDisconnect(repo) : handleConnect(repo)
                  }
                  disabled={busy}
                  className={cn("shrink-0 gap-2")}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : connected ? (
                    <>
                      <Unlink className="size-4" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 className="size-4" />
                      Connect
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {totalCount > 30 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(totalCount / 30)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalCount / 30)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
