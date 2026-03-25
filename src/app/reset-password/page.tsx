import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { verifyResetToken } from "../forgot-password/actions";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth-card";

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
      <AuthCard title="Invalid reset link" description="This password reset link is invalid or has expired.">
        <Button asChild className="h-10 w-full rounded-xl">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  const { valid } = await verifyResetToken(token);

  if (!valid) {
    return (
      <AuthCard title="Link expired" description="This password reset link has expired. Please request a new one.">
        <Button asChild className="h-10 w-full rounded-xl">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" description="Enter your new password below">
      <ResetPasswordForm token={token} />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/signin" className="font-medium text-brand underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
