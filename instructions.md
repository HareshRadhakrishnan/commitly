This **Product Requirements Document (PRD)** is designed for a solo developer to build a lean, functional AI Agent. It focuses on the "Repo-to-Release" workflow with the specific trigger and notification features you requested.

---

# PRD: "Commitly AI" – The AI Product Marketing Agent

## 1. Executive Summary

**Commitly AI** is an AI-powered B2B agent that bridges the gap between technical development and marketing. It monitors GitHub commits, identifies "value-add" updates, and automatically drafts release notes and social media content for developers and founders to review and publish.

## 2. Target Audience

* Solo Founders building in public.
* Small-to-medium engineering teams (5-20 devs).
* Technical Product Managers who need to keep stakeholders updated.

## 3. Technical Stack (Recommended)

* **Framework:** Next.js 15 (App Router).
* **Auth:** NextAuth.js or Supabase Auth.
* **Database:** Supabase (PostgreSQL) + pgvector (for future memory).
* **AI Orchestration:** Vercel AI SDK (with Claude 3.5 Sonnet or GPT-4o).
* **Worker/Queue:** Inngest (for background webhook processing).
* **Email:** Resend.
* **Styling:** Tailwind CSS 4 with semantic CSS tokens (`--brand` violet, black `--primary` CTAs, cool-gray surfaces). See `.cursor/plans/Ui-design-spec.md` for the full visual spec.

---

## 4. Feature Requirements

### 4.1. Authentication & Onboarding

* **Multi-Auth:** Users can sign up via **Email & Password**, **Google**, or **GitHub**.
* **GitHub App Installation:** After signup, the user must authorize a GitHub App to access specific repositories.
* **Configuration:** User sets their "Brand Voice" (e.g., *Professional, Casual, Hype*).

### 4.2. Automated Trigger & Filtering

* **Webhook Listener:** A listener for the `push` event from GitHub.
* **The "Significance" Filter:** * The Agent receives the commit messages/diffs.
* **Logic:** It discards "invisible" updates (e.g., "typo fix," "refactor," "update .gitignore").
* **Action:** Only if the AI determines the update adds user-facing value does it proceed to generation.



### 4.3. Generation & Notification

* **Draft Generation:** The Agent drafts a 3-part output:
1. **Changelog Entry:** (Bullets focused on user benefits).
2. **LinkedIn Post:** (Hook-heavy "Build in Public" style).
3. **X/Twitter Thread:** (Concise and engaging).


* **Email Notification:** Sends an email via **Resend** with a magic link: *"We detected a significant update! Review your generated notes here."*

### 4.4. Review & Publishing Dashboard

* **Draft Workspace:** A UI to edit the generated AI text.
* **One-Click Copy:** Buttons to copy text for manual posting.

---

## 5. Step-by-Step Build Instructions

### Phase 1: The Foundation (Days 1-2)

1. **Initialize Next.js Project:** Setup Tailwind CSS and Lucide-react for icons.
2. **Configure Auth:** Setup **NextAuth** with Email/Password (Credentials), Google, and GitHub providers.
3. **Database Schema:** * `Users` table.
* `Repositories` table (linked to User).
* `GeneratedLogs` table (ID, content, status: 'pending/published', commit_shas).



### Phase 2: The GitHub Pipeline (Days 3-4)

1. **GitHub App Setup:** Create a GitHub App in your developer settings. Give it `Contents: Read` and `Webhooks: Read` permissions.
2. **Webhook Endpoint:** Create a Route Handler `api/webhooks/github`.
3. **Validation Logic:** Verify the GitHub webhook secret. Parse the payload to get the list of commits.

### Phase 3: The AI "Brain" (Day 5)

1. **Integration:** Install `ai` (Vercel SDK).
2. **Prompt Engineering:**
* **Filter Prompt:** *"Look at these commits: [Commits]. Is there a new feature or major bug fix here? Answer YES or NO."*
* **Generation Prompt:** *"Based on these commits, write a LinkedIn post in the 'Founder' voice..."*


3. **Background Processing:** Use **Inngest** to handle the AI call so the GitHub webhook doesn't time out (GitHub expects a response in < 10 seconds).

### Phase 4: Notification & UI (Day 6)

1. **Email Template:** Create a clean email template in **Resend**.
2. **The Draft UI:** Create a page `/dashboard/review/[logId]` where the user can see the "Before" (technical commits) and "After" (AI marketing copy).

### Phase 5: Polish & Security (Day 7)

1. **Rate Limiting:** Ensure a user doesn't trigger 100 emails if they push 100 times in an hour (Batching logic).
2. **Deployment:** Deploy to Vercel and set up environment variables.

---

## 6. Data Schema (Simplified)

```sql
Table Users {
  id uuid [pk]
  email string
  auth_id string [unique]  // e.g. "cred|email" or "google|123"
  password_hash string?   // for email/password only; null for OAuth
  onboarding_complete boolean
}

Table Projects {
  id uuid [pk]
  user_id uuid [ref: > Users.id]
  github_repo_id int
  repo_name string
}

Table ReleaseDrafts {
  id uuid [pk]
  project_id uuid [ref: > Projects.id]
  ai_content jsonb // stores linkedin, twitter, changelog
  status string // 'pending', 'approved'
  created_at timestamp
}

```

---

## 7. Success Metrics for MVP

* **Latency:** Webhook to Email delivery in under 60 seconds.
* **Accuracy:** AI correctly filters out "chore" commits 90% of the time.
* **Retention:** User clicks the "Review" link in the email at least 50% of the time.

---

