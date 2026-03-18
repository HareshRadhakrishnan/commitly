"use server";

import { SignJWT, jwtVerify } from "jose";
import { hash as bcryptHash } from "bcryptjs";
import { getCredentialUser, updateUserPassword } from "@/lib/db/users";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-me"
);

export async function requestPasswordReset(email: string) {
  const user = await getCredentialUser(email);

  if (!user) {
    return { success: true };
  }

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(SECRET);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return { success: true };
}

export async function verifyResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { valid: true, email: payload.email as string };
  } catch {
    return { valid: false, email: null };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const { valid, email } = await verifyResetToken(token);

  if (!valid || !email) {
    throw new Error("Invalid or expired reset link");
  }

  const user = await getCredentialUser(email);
  if (!user) {
    throw new Error("User not found");
  }

  const passwordHash = await bcryptHash(newPassword, 12);
  await updateUserPassword(email, passwordHash);

  return { success: true };
}
