import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { getReleaseDraftById } from "@/lib/db/release-drafts";
import { getOrCreateUser } from "@/lib/db/users";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");
  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { logId } = await params;
  const draft = await getReleaseDraftById(logId);

  if (!draft) notFound();

  const projectRaw = draft.projects;
  const project = Array.isArray(projectRaw)
    ? projectRaw[0]
    : projectRaw;
  const projectData =
    project && typeof project === "object" && "user_id" in project
      ? (project as { user_id: string; repo_name: string })
      : null;
  if (!projectData || projectData.user_id !== dbUser.id) {
    notFound();
  }

  const content = (draft.ai_content as {
    changelog?: string;
    linkedin?: string;
    twitter?: string[];
    original_commits?: { id: string; message: string }[];
  }) ?? {};

  const originalCommits = content.original_commits ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                Commitly
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Review draft — {projectData.repo_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {new Date(draft.created_at).toLocaleDateString()}
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Before (technical commits)
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            {originalCommits.length > 0 ? (
              <ul className="space-y-2 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {originalCommits.map((c) => (
                  <li key={c.id}>
                    <span className="text-zinc-500">{c.id.slice(0, 7)}</span>{" "}
                    {c.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No commit details stored</p>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            After (AI marketing copy)
          </h2>
          <div className="space-y-6">
            {content.changelog && (
              <CopyBlock
                title="Changelog"
                content={content.changelog}
              />
            )}
            {content.linkedin && (
              <CopyBlock
                title="LinkedIn Post"
                content={content.linkedin}
              />
            )}
            {content.twitter && content.twitter.length > 0 && (
              <CopyBlock
                title="Twitter / X Thread"
                content={content.twitter.join("\n\n")}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function CopyBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {title}
        </span>
        <CopyButton text={content} />
      </div>
      <div className="whitespace-pre-wrap p-4 text-sm text-zinc-700 dark:text-zinc-300">
        {content}
      </div>
    </div>
  );
}

