import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Sparkles className="h-12 w-12 text-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Forgot your password?
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <ForgotPasswordForm />

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
