import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

/**
 * Manual test: GET /api/test-webhook to send a fake push event to Inngest.
 * Use this to verify Inngest is receiving events (no GitHub webhook needed).
 */
export async function GET() {
  await inngest.send({
    name: "github/push",
    data: {
      repository: {
        id: 123456,
        full_name: "test/repo",
        name: "repo",
      },
      commits: [
        {
          id: "abc123",
          message: "Add user authentication",
          author: { name: "Test", email: "test@example.com" },
          url: "https://github.com/test/repo/commit/abc123",
        },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Test event sent to Inngest. Check http://localhost:8288",
  });
}
