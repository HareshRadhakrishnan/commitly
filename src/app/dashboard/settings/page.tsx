import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Mic2 } from "lucide-react";
import { getOrCreateUser } from "@/lib/db/users";
import { getBrandExamplesForUser } from "@/lib/db/brand-examples";
import { BrandVoiceForm } from "./BrandVoiceForm";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");

  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");
  const brandExamples = await getBrandExamplesForUser(dbUser.id);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences and AI brand voice.
        </p>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Mic2 className="size-5 text-brand" strokeWidth={1.5} />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Brand Voice</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Teach the AI your writing style by adding example posts. Commitly AI uses these as a
          reference when generating content from your commits.
        </p>

        <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <CardContent className="pt-6">
            <BrandVoiceForm initialExamples={brandExamples} />
          </CardContent>
        </Card>

        <p className="mt-3 text-xs text-muted-foreground">
          {brandExamples.length === 0
            ? "No examples yet — the AI will use a default professional tone."
            : `${brandExamples.length} example${brandExamples.length === 1 ? "" : "s"} saved across all platforms.`}
        </p>
      </section>
    </div>
  );
}
