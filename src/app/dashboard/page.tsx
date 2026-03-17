import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, LogOut, FileText } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AddProjectForm } from "./projects/AddProjectForm";
import { RepoPicker } from "./projects/RepoPicker";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, repo_name, github_repo_id")
    .eq("user_id", dbUser.id)
    .eq("is_active", true);

  const { data: installations } = await supabaseAdmin
    .from("github_installations")
    .select("installation_id")
    .eq("user_id", dbUser.id);

  const hasGitHubInstallation =
    installations && installations.length > 0;

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              Commitly
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.email ?? session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome, {session.user.name ?? "there"}!
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You&apos;re signed in. Next up: connect your GitHub repositories and
          configure your brand voice.
        </p>
        <p className="mt-4 rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          DB connected ✓ — Onboarding:{" "}
          {dbUser.onboarding_complete ? "Complete" : "Pending"}
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Connected repos
          </h2>
          {projects && projects.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {projects.map((p) => (
                <li key={p.id}>
                  {p.repo_name} (ID: {p.github_repo_id})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              No repos connected. Add one below to receive AI drafts on push.
            </p>
          )}
          <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Connect repositories
            </h3>
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
              <div className="space-y-4">
                <a
                  href={process.env.GITHUB_APP_SLUG ? `https://github.com/apps/${process.env.GITHUB_APP_SLUG}/installations/new` : "#"}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Connect GitHub
                </a>
                <p className="text-xs text-zinc-500">
                  Install the Commitly app on your GitHub account to see your
                  repositories. You can select which repos to connect.
                </p>
                <details className="group">
                  <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700">
                    Or add manually (advanced)
                  </summary>
                  <div className="mt-3">
                    <AddProjectForm />
                  </div>
                </details>
              </div>
            )}
          </div>

        {drafts && drafts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Recent drafts
            </h2>
            <ul className="mt-2 space-y-2">
              {drafts.map((d) => {
                const p = Array.isArray(d.projects)
                  ? d.projects[0]
                  : d.projects;
                const repoName =
                  p && typeof p === "object" && "repo_name" in p
                    ? (p as { repo_name: string }).repo_name
                    : "Unknown repo";
                return (
                  <li key={d.id}>
                    <Link
                      href={`/dashboard/review/${d.id}`}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span className="flex-1">
                        {repoName} — {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        </section>
      </main>
    </div>
  );
}
