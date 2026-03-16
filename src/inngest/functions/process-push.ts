import { inngest } from "../client";
import type { PushCommit } from "@/lib/github/webhook";
import { getProjectByRepoId } from "@/lib/db/projects";
import {
  createReleaseDraft,
  countRecentDraftsForProject,
} from "@/lib/db/release-drafts";
import { getUserById } from "@/lib/db/users";
import { checkSignificance, generateContent } from "@/lib/ai/generate";
import { sendDraftNotificationEmail } from "@/lib/email/resend";

type PushEventData = {
  repository: {
    id: number;
    full_name: string;
    name: string;
  };
  commits: PushCommit[];
};

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
      return { skipped: true, reason: "repo not connected to LogLogic" };
    }

    const isSignificant = await step.run("check-significance", async () => {
      return checkSignificance(commits);
    });

    if (!isSignificant) {
      return { skipped: true, reason: "commits not significant" };
    }

    const content = await step.run("generate-content", async () => {
      return generateContent(commits);
    });

    const draft = await step.run("create-draft", async () => {
      return createReleaseDraft({
        project_id: project.id,
        ai_content: {
          changelog: content.changelog,
          linkedin: content.linkedin,
          twitter: content.twitter,
          original_commits: commits.map((c) => ({ id: c.id, message: c.message })),
        },
        commit_shas: commits.map((c) => c.id),
      });
    });

    const user = await step.run("get-user", async () => {
      return getUserById(project.user_id);
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
