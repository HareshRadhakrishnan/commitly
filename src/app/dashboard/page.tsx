import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, LogOut, FileText } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AddProjectForm } from "./projects/AddProjectForm";

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
    .eq("user_id", dbUser.id);

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
              LogLogic
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
              Connect a repo
            </h3>
            <AddProjectForm />
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
