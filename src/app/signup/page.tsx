import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignUpForm } from "./SignUpForm";
import { AuthCard } from "@/components/auth-card";

export default async function SignUpPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthCard title="Create an account" description="Sign up with email and password">
      <SignUpForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
