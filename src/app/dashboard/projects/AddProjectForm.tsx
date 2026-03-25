"use client";

import { useState } from "react";
import { addProject } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <div className="flex flex-wrap gap-2">
        <Input
          type="text"
          placeholder="Repo ID (e.g. 123456)"
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
          className="min-w-[8rem] flex-1"
        />
        <Input
          type="text"
          placeholder="owner/repo"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          className="min-w-[10rem] flex-[2]"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Get repo ID from: GitHub repo → Settings → General (bottom) or from
        webhook payload
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50">
          <AlertDescription>Project connected!</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={loading} size="sm" className="w-fit">
        {loading ? "Adding…" : "Connect repo"}
      </Button>
    </form>
  );
}
