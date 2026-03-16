"use server";

import { auth } from "@/auth";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function addProject(repoId: number, repoName: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const authId = session.user.id ?? session.user.email;
  if (!authId) throw new Error("No user id");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { error } = await supabaseAdmin.from("projects").insert({
    user_id: dbUser.id,
    github_repo_id: repoId,
    repo_name: repoName,
  });

  if (error) throw error;
}
