"use server";

import { signIn } from "@/auth";

export async function signInWithCredentials(email: string, password: string) {
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}
