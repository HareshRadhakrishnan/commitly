import { auth } from "@/auth";
import Link from "next/link";
import { Sparkles, LogIn, LayoutDashboard } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 px-8 py-16 text-center">
        <div className="flex items-center gap-3">
          <Sparkles className="h-10 w-10 text-amber-500" />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Commitly
          </h1>
        </div>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          The AI-powered B2B agent that turns GitHub commits into release notes
          and social media content.
        </p>
        <div className="flex gap-4">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition hover:bg-amber-600"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/signin"
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition hover:bg-amber-600"
              >
                <LogIn className="h-5 w-5" />
                Sign in
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-lg border border-amber-500 px-6 py-3 font-medium text-amber-600 transition hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          Phase 1: Foundation ✓ — Next.js, Tailwind, Lucide, Auth
        </p>
      </main>
    </div>
  );
}
