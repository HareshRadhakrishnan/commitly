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
    is_active: true,
  });

  if (error) throw error;
}

export async function connectRepo(repoId: number, repoName: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const authId = session.user.id ?? session.user.email;
  if (!authId) throw new Error("No user id");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("user_id", dbUser.id)
    .eq("github_repo_id", repoId)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("projects")
      .update({ is_active: true })
      .eq("id", existing.id);
  } else {
    const { error } = await supabaseAdmin.from("projects").insert({
      user_id: dbUser.id,
      github_repo_id: repoId,
      repo_name: repoName,
      is_active: true,
    });
    if (error) throw error;
  }
}

export async function disconnectRepo(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const authId = session.user.id ?? session.user.email;
  if (!authId) throw new Error("No user id");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { error } = await supabaseAdmin
    .from("projects")
    .update({ is_active: false })
    .eq("id", projectId)
    .eq("user_id", dbUser.id);

  if (error) throw error;
}
