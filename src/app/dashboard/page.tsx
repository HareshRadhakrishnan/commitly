import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ChevronRight, Github } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AddProjectForm } from "./projects/AddProjectForm";
import { RepoPicker } from "./projects/RepoPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const [draftCount, limits] = await Promise.all([
    import("@/lib/db/usage").then((m) => m.getDraftCountForUserThisMonth(dbUser.id)),
    import("@/lib/subscription").then((m) => m.getTierLimits(dbUser.subscription_tier)),
  ]);

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, repo_name, github_repo_id")
    .eq("user_id", dbUser.id)
    .eq("is_active", true);

  const { data: installations } = await supabaseAdmin
    .from("github_installations")
    .select("installation_id")
    .eq("user_id", dbUser.id);

  const hasGitHubInstallation = installations && installations.length > 0;

  const projectIds = projects?.map((p) => p.id) ?? [];
  const { data: drafts } =
    projectIds.length > 0
      ? await supabaseAdmin
          .from("release_drafts")
          .select("id, created_at, projects(repo_name)")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const atLimit =
    limits.draftsPerMonth !== Infinity && draftCount >= limits.draftsPerMonth;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Greeting + stats */}
      <div>
        <h1 className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your connected repos.
        </p>

        {/* Inline usage stats */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Drafts this month
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-foreground">
              {draftCount}
              {limits.draftsPerMonth !== Infinity && (
                <span className="text-base font-normal text-muted-foreground">
                  {" "}/ {limits.draftsPerMonth}
                </span>
              )}
            </p>
            {limits.draftsPerMonth !== Infinity && (
              <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (draftCount / limits.draftsPerMonth) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-border" />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Repos connected
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-foreground">
              {projects?.length ?? 0}
              {limits.repos !== Infinity && (
                <span className="text-base font-normal text-muted-foreground">
                  {" "}/ {limits.repos}
                </span>
              )}
            </p>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Badge
              className="bg-brand-muted text-brand hover:bg-brand-muted border-0 text-[11px] font-semibold uppercase tracking-wider"
            >
              {(dbUser.subscription_tier as string | null) ?? "Free"}
            </Badge>
            {atLimit && (
              <Button variant="linkBrand" size="xs" asChild>
                <Link href="/dashboard/billing">Upgrade →</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Connected repos + connect card */}
      <section>
        <h2 className="mb-4 text-base font-semibold leading-snug tracking-[-0.01em] text-foreground">
          Connected repositories
        </h2>

        {projects && projects.length > 0 && (
          <ul className="mb-4 space-y-1">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/60"
              >
                <Github className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="font-medium text-foreground">{p.repo_name}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  #{p.github_repo_id}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <CardHeader>
            <CardTitle className="text-base">Connect repositories</CardTitle>
            <CardDescription>
              Install the GitHub app or connect repos to start generating drafts on every push.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasGitHubInstallation ? (
              <RepoPicker
                hasInstallation={true}
                connectedProjects={
                  projects?.map((p) => ({
                    id: p.id,
                    github_repo_id: p.github_repo_id,
                  })) ?? []
                }
              />
            ) : (
              <div className="space-y-3">
                <Button asChild className="gap-2 rounded-xl">
                  <a
                    href={
                      process.env.GITHUB_APP_SLUG
                        ? `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new`
                        : "#"
                    }
                  >
                    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connect GitHub
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Install the Commitly AI GitHub App to see and connect your repositories.
                </p>
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Or add manually (advanced)
                  </summary>
                  <div className="mt-3">
                    <AddProjectForm />
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent drafts */}
      {drafts && drafts.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">
            Recent drafts
          </h2>
          <ul className="space-y-1">
            {drafts.map((d) => {
              const p = Array.isArray(d.projects) ? d.projects[0] : d.projects;
              const repoName =
                p && typeof p === "object" && "repo_name" in p
                  ? (p as { repo_name: string }).repo_name
                  : "Unknown repo";
              return (
                <li key={d.id}>
                  <Link
                    href={`/dashboard/review/${d.id}`}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/60"
                  >
                    <FileText
                      className="size-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="font-medium text-foreground">{repoName}</span>
                    <span className="text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                    <ChevronRight
                      className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      strokeWidth={1.5}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
