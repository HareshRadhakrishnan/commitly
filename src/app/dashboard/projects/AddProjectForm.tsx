"use client";

import { useState } from "react";
import { addProject } from "../actions";

export function AddProjectForm() {
  const [repoId, setRepoId] = useState("");
  const [repoName, setRepoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const id = parseInt(repoId, 10);
      if (isNaN(id) || !repoName.trim()) {
        throw new Error("Enter valid repo ID and name (e.g. owner/repo)");
      }
      await addProject(id, repoName.trim());
      setSuccess(true);
      setRepoId("");
      setRepoName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Repo ID (e.g. 123456)"
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="text"
          placeholder="owner/repo"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Get repo ID from: GitHub repo → Settings → General (bottom) or from
        webhook payload
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Project connected!</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {loading ? "Adding…" : "Connect repo"}
      </button>
    </form>
  );
}
