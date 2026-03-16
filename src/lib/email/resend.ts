import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM ?? "LogLogic <onboarding@resend.dev>";

export async function sendDraftNotificationEmail(
  to: string,
  reviewUrl: string,
  repoName: string
) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `We detected a significant update in ${repoName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: 700; color: #f59e0b;">LogLogic</span>
  </div>
  <h1 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px;">
    We detected a significant update!
  </h1>
  <p style="margin: 0 0 24px; color: #6b7280;">
    Your recent commits in <strong>${repoName}</strong> look like they add user-facing value. We've drafted release notes and social media content for you to review.
  </p>
  <a href="${reviewUrl}" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
    Review your generated notes
  </a>
  <p style="margin: 24px 0 0; font-size: 13px; color: #9ca3af;">
    If you didn't expect this email, you can safely ignore it.
  </p>
</body>
</html>
    `.trim(),
  });

  if (error) throw error;
  return data;
}
