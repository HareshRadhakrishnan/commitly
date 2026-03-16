import { supabaseAdmin } from "@/lib/supabase/server";

const CRED_PREFIX = "cred|";

export function getCredAuthId(email: string) {
  return `${CRED_PREFIX}${email}`;
}

export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, email, onboarding_complete")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getOrCreateUser(authId: string, email: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, email, onboarding_complete")
    .eq("auth_id", authId)
    .single();

  if (existing) {
    return existing;
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({ auth_id: authId, email })
    .select("id, auth_id, email, onboarding_complete")
    .single();

  if (error) throw error;
  return created;
}

export async function createUserWithPassword(
  email: string,
  passwordHash: string
) {
  const authId = getCredAuthId(email);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({ auth_id: authId, email, password_hash: passwordHash })
    .select("id, auth_id, email, onboarding_complete")
    .single();

  if (error) throw error;
  return data;
}

export async function getCredentialUser(email: string) {
  const authId = getCredAuthId(email);

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, auth_id, email, password_hash, onboarding_complete")
    .eq("auth_id", authId)
    .single();

  if (error || !data) return null;
  return data;
}
