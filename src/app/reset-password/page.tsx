import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { verifyResetToken } from "../forgot-password/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  const { token } = await searchParams;

  if (session?.user) {
    redirect("/dashboard");
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
        <main className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Sparkles className="h-12 w-12 text-amber-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Invalid reset link
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white hover:bg-amber-600"
          >
            Request a new link
          </Link>
        </main>
      </div>
    );
  }

  const { valid } = await verifyResetToken(token);

  if (!valid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
        <main className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Sparkles className="h-12 w-12 text-amber-500" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Link expired
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This password reset link has expired. Please request a new one.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white hover:bg-amber-600"
          >
            Request a new link
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Sparkles className="h-12 w-12 text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Reset your password
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>

        <ResetPasswordForm token={token} />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Remember your password?{" "}
          <Link
            href="/signin"
            className="font-medium text-amber-600 hover:text-amber-500"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
