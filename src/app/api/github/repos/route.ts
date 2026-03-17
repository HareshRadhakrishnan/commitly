import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listInstallationRepos } from "@/lib/github/app";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authId = session.user.id ?? session.user.email;
  if (!authId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { data: installations } = await supabaseAdmin
    .from("github_installations")
    .select("installation_id")
    .eq("user_id", dbUser.id);

  if (!installations || installations.length === 0) {
    return NextResponse.json({ repositories: [], total_count: 0 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = Math.min(
    parseInt(searchParams.get("per_page") ?? "30", 10),
    100
  );

  const installationId = installations[0].installation_id;

  try {
    const { repositories, total_count } = await listInstallationRepos(
      installationId,
      page,
      perPage
    );
    return NextResponse.json({ repositories, total_count });
  } catch (err) {
    console.error("[api/github/repos]", err);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
