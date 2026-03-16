"use server";

import { hash as bcryptHash } from "bcryptjs";
import { signIn } from "@/auth";
import { createUserWithPassword, getCredentialUser } from "@/lib/db/users";

export async function hash(password: string): Promise<string> {
  return bcryptHash(password, 12);
}

export async function signUpAndSignIn(
  email: string,
  password: string,
  passwordHash: string
) {
  const existing = await getCredentialUser(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  await createUserWithPassword(email, passwordHash);

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}
