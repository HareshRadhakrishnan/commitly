import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function GitHubCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string; setup_action?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { installation_id, setup_action } = await searchParams;

  if (!installation_id) {
    redirect("/dashboard?github=error");
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { error } = await supabaseAdmin.from("github_installations").upsert(
    {
      user_id: dbUser.id,
      installation_id: parseInt(installation_id, 10),
      account_login: null,
    },
    {
      onConflict: "installation_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("[github/callback]", error);
    redirect("/dashboard?github=error");
  }

  redirect("/dashboard?github=connected");
}
