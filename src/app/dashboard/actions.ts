"use server";

import { auth } from "@/auth";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { canConnectRepo } from "@/lib/subscription";

export async function addProject(repoId: number, repoName: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const authId = session.user.id ?? session.user.email;
  if (!authId) throw new Error("No user id");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { count } = await supabaseAdmin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", dbUser.id)
    .eq("is_active", true);
  const currentRepos = count ?? 0;
  if (!canConnectRepo(dbUser.subscription_tier, currentRepos)) {
    throw new Error("Repo limit reached. Upgrade to connect more repositories.");
  }

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

  if (!existing) {
    const { count } = await supabaseAdmin
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", dbUser.id)
      .eq("is_active", true);
    const currentRepos = count ?? 0;
    if (!canConnectRepo(dbUser.subscription_tier, currentRepos)) {
      throw new Error("Repo limit reached. Upgrade to connect more repositories.");
    }
  }

  const { data: installation } = await supabaseAdmin
    .from("github_installations")
    .select("installation_id")
    .eq("user_id", dbUser.id)
    .limit(1)
    .single();

  const installationId = installation?.installation_id ?? null;

  if (existing) {
    await supabaseAdmin
      .from("projects")
      .update({ is_active: true, github_installation_id: installationId })
      .eq("id", existing.id);
  } else {
    const { error } = await supabaseAdmin.from("projects").insert({
      user_id: dbUser.id,
      github_repo_id: repoId,
      repo_name: repoName,
      is_active: true,
      github_installation_id: installationId,
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
