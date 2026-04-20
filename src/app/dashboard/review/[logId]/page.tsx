import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { CopyButton } from "./CopyButton";
import { getReleaseDraftById } from "@/lib/db/release-drafts";
import { getOrCreateUser } from "@/lib/db/users";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authId = session.user.id ?? session.user.email;
  if (!authId) redirect("/signin");
  const dbUser = await getOrCreateUser(authId, session.user.email ?? "");

  const { logId } = await params;
  const draft = await getReleaseDraftById(logId);

  if (!draft) notFound();

  const projectRaw = draft.projects;
  const project = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw;
  const projectData =
    project && typeof project === "object" && "user_id" in project
      ? (project as { user_id: string; repo_name: string })
      : null;
  if (!projectData || projectData.user_id !== dbUser.id) {
    notFound();
  }

  const content = (draft.ai_content as {
    changelog?: string;
    linkedin?: string;
    twitter?: string[];
    original_commits?: { id: string; message: string }[];
    commit_explanations?: { sha: string; explanation: string }[];
    commit_digests?: { sha: string; digest: string }[];
  }) ?? {};

  const originalCommits = content.original_commits ?? [];
  const commitExplanations = content.commit_explanations ?? [];
  const commitDigests = content.commit_digests ?? [];

  const tabs = [
    content.changelog && { key: "changelog", label: "Changelog", content: content.changelog },
    content.linkedin && { key: "linkedin", label: "LinkedIn", content: content.linkedin },
    content.twitter?.length &&
      content.twitter.length > 0 && {
        key: "twitter",
        label: "Twitter / X",
        content: content.twitter.join("\n\n— —\n\n"),
      },
  ].filter(Boolean) as { key: string; label: string; content: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Badge
            className="bg-brand-muted text-brand hover:bg-brand-muted border-0 text-[11px] font-semibold"
          >
            {projectData.repo_name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(draft.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Review draft
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and copy the AI-generated marketing content below.
        </p>
      </div>

      {/* Before: original commits */}
      <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Before — technical commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {originalCommits.length > 0 ? (
            <ul className="space-y-2 font-mono text-[13px] leading-relaxed text-foreground">
              {originalCommits.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground">{c.id.slice(0, 7)}</span>
                  <span>{c.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No commit details stored.</p>
          )}
        </CardContent>
      </Card>

      {/* Changed symbols: CST structural digest */}
      {commitDigests.length > 0 && (
        <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border-l-4 border-l-brand">
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Changed symbols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {commitDigests.map((item) => (
                <li key={item.sha} className="space-y-1">
                  <span className="font-mono text-[12px] text-muted-foreground">{item.sha}</span>
                  <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-foreground">
                    {item.digest}
                  </pre>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What changed: engineer's view */}
      {commitExplanations.length > 0 && (
        <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] border-l-4 border-l-amber-400">
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              What changed — engineer&apos;s view
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-5">
              {commitExplanations.map((item) => (
                <li key={item.sha} className="space-y-1">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {item.sha}
                  </span>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                    {item.explanation}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* After: generated content in tabs */}
      {tabs.length > 0 ? (
        <div>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            After — AI marketing copy
          </h2>
          <Tabs defaultValue={tabs[0].key}>
            <TabsList className="mb-4">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t.key} value={t.key}>
                <Card className="rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-sm font-medium">{t.label}</CardTitle>
                    <CardAction>
                      <CopyButton text={t.content} />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-[15px] leading-[1.75] text-foreground">
                      {t.content}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No generated content available.</p>
      )}
    </div>
  );
}
