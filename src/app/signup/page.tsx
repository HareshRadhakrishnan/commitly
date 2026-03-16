import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage() {
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
            Create an account
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign up with email and password
          </p>
        </div>

        <SignUpForm />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
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
