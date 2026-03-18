import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, LogOut, ArrowLeft, Mic2 } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { getBrandExamplesForUser } from "@/lib/db/brand-examples";
import { BrandVoiceForm } from "./BrandVoiceForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const brandExamples = await getBrandExamplesForUser(dbUser.id);

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
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">Commitly</span>
            </div>
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your account preferences and AI brand voice.
        </p>

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Brand Voice
            </h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Teach the AI your writing style by adding example posts. Commitly will use
            these as a reference when generating content from your commits.
          </p>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <BrandVoiceForm initialExamples={brandExamples} />
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            {brandExamples.length === 0
              ? "No examples yet — the AI will use a default professional tone."
              : `${brandExamples.length} example${brandExamples.length === 1 ? "" : "s"} saved across all platforms.`}
          </p>
        </section>
      </main>
    </div>
  );
}
