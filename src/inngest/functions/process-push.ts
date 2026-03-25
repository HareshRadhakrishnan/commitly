import { inngest } from "../client";
import type { PushCommit } from "@/lib/github/webhook";
import type { CommitWithContext } from "@/lib/ai/prompts";
import { getProjectByRepoId } from "@/lib/db/projects";
import {
  createReleaseDraft,
  countRecentDraftsForProject,
} from "@/lib/db/release-drafts";
import { getUserById } from "@/lib/db/users";
import { getDraftCountForUserThisMonth, incrementDraftCount } from "@/lib/db/usage";
import { canCreateDraft } from "@/lib/subscription";
import { checkSignificance, generateContent } from "@/lib/ai/generate";
import { sendDraftNotificationEmail } from "@/lib/email/resend";
import { fetchCommitDiff } from "@/lib/github/app";
import { getBrandExamplesForUser } from "@/lib/db/brand-examples";

type PushEventData = {
  repository: {
    id: number;
    full_name: string;
    name: string;
  };
  commits: PushCommit[];
};

const DIFF_CHARS_PER_FILE = 1500;
const DIFF_FILES_PER_COMMIT = 10;

export const processPush = inngest.createFunction(
  { id: "process-push" },
  { event: "github/push" },
  async ({ event, step }) => {
    const { repository, commits } = event.data as PushEventData;

    if (commits.length === 0) {
      return { skipped: true, reason: "no commits" };
    }

    const project = await step.run("find-project", async () => {
      return getProjectByRepoId(repository.id);
    });

    if (!project) {
      return { skipped: true, reason: "repo not connected to Commitly AI" };
    }

    const commitsWithContext = await step.run("fetch-diffs", async (): Promise<CommitWithContext[]> => {
      const installationId = project.github_installation_id;
      const hasInstallation = typeof installationId === "number";

      return Promise.all(
        commits.map(async (c): Promise<CommitWithContext> => {
          const base: CommitWithContext = { ...c };
          if (!hasInstallation) return base;

          const detail = await fetchCommitDiff(
            repository.full_name,
            installationId,
            c.id
          );
          if (!detail?.files?.length) return base;

          const parts = detail.files
            .slice(0, DIFF_FILES_PER_COMMIT)
            .map((f) => {
              const patch = f.patch ?? "";
              const truncated =
                patch.length > DIFF_CHARS_PER_FILE
                  ? patch.slice(0, DIFF_CHARS_PER_FILE) + "\n... (truncated)"
                  : patch;
              return `--- ${f.filename} (${f.additions}+/${f.deletions}-) ---\n${truncated}`;
            });
          base.diffText = parts.join("\n\n");
          return base;
        })
      );
    });

    const isSignificant = await step.run("check-significance", async () => {
      return checkSignificance(commitsWithContext);
    });

    if (!isSignificant) {
      return { skipped: true, reason: "commits not significant" };
    }

    const user = await step.run("get-user", async () => {
      return getUserById(project.user_id);
    });

    const withinLimit = await step.run("check-usage-limit", async () => {
      const draftCount = await getDraftCountForUserThisMonth(project.user_id);
      return canCreateDraft(user?.subscription_tier, draftCount);
    });

    if (!withinLimit) {
      return { skipped: true, reason: "draft limit reached for this month" };
    }

    const brandExamples = await step.run("fetch-brand-examples", async () => {
      return getBrandExamplesForUser(project.user_id);
    });

    const content = await step.run("generate-content", async () => {
      return generateContent(commits, undefined, brandExamples);
    });

    const draft = await step.run("create-draft", async () => {
      const d = await createReleaseDraft({
        project_id: project.id,
        ai_content: {
          changelog: content.changelog,
          linkedin: content.linkedin,
          twitter: content.twitter,
          original_commits: commits.map((c) => ({ id: c.id, message: c.message })),
        },
        commit_shas: commits.map((c) => c.id),
      });
      await incrementDraftCount(project.user_id);
      return d;
    });

    const shouldSendEmail =
      user?.email &&
      process.env.RESEND_API_KEY &&
      (await step.run("check-email-rate-limit", async () => {
        const recentCount = await countRecentDraftsForProject(
          project.id,
          60
        );
        return recentCount <= 1;
      }));

    if (shouldSendEmail) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const reviewUrl = `${baseUrl}/dashboard/review/${draft.id}`;

      await step.run("send-email", async () => {
        await sendDraftNotificationEmail(
          user!.email,
          reviewUrl,
          project.repo_name
        );
      });
    }

    return {
      success: true,
      draft_id: draft.id,
      project_id: project.id,
    };
  }
);
