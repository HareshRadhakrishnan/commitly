# Version 2 PRD: "Commitly" – Customer-Ready Upgrade

## 1. Executive Summary

Version 2 transforms Commitly from MVP to a production-ready product with **zero-config onboarding**, **direct social publishing**, and **monetization**. The goal: users reach their first AI-generated post in under 3 minutes.

---

## 2. Build Phases (Recommended Order)

| Phase | Feature | Effort | Impact |
|-------|---------|--------|--------|
| **2a** | Automated Repository Discovery | Medium | High – removes manual Repo ID friction |
| **2b** | Subscription & Usage Limits | Medium | High – enables monetization |
| **2c** | Custom Brand Personas | Low | Medium – differentiator for Pro |
| **2d** | Direct Social Publishing | High | High – key Pro feature |

---

## 3. Feature Specifications

### 3.1. Automated Repository Discovery (Phase 2a)

**Goal:** Replace manual Repo ID input with a searchable list of repos the user can connect in one click.

**Flow:**
1. User clicks "Connect GitHub" → GitHub App installation OAuth flow
2. After install, we receive `installation_id` from webhook or callback
3. Fetch repos via `GET /installation/repositories` (GitHub App API)
4. Display: searchable, paginated list with repo name, avatar, description, **ordered by date last updated (newest first)**
5. "Connect" button: creates project in DB, webhook is already active (GitHub App sends to all installed repos)
6. "Disconnect" button: set `is_active = false` (we stop processing; user can uninstall app separately)

**Technical notes:**
- **GitHub App vs OAuth App:** We need a **GitHub App** (not OAuth App) for `installation/repositories`. The app creates webhooks per installation when user installs on org/repo.
- **Webhook scope:** GitHub App webhooks include `installation` in payload. We use `installation.id` to associate repos with our projects.
- **Migration:** Existing manual projects stay; new flow uses GitHub App installation. Consider unifying both.

**Schema:** Add `github_installation_id` to Projects (nullable for legacy manual projects).

---

### 3.2. Subscription & Usage Limits (Phase 2b)

**Tiers:**

| Tier | Price | Repos | Drafts/mo | Features |
|------|-------|-------|-----------|----------|
| **Free (Indie)** | $0 | 1 | 3 | Copy/Paste only |
| **Founder (Pro)** | $19/mo | Unlimited | Unlimited | Brand Voice, Direct Publishing |
| **Team (Agency)** | $49/mo | Unlimited | Unlimited | 5 members, Newsletter, Fine-tuning |

**Implementation:**
- **Stripe:** Stripe Checkout for subscriptions; webhook for `customer.subscription.created/updated/deleted`
- **Usage tracking:** Count drafts per user per month; enforce in Inngest before creating draft
- **Growth hack:** "Build in Public" discount – 20% off if user mentions "Drafted by Commitly" in a post (manual verification or future automation)

**Schema:**

```sql
-- Add to Users
subscription_tier text // 'free', 'founder', 'team'
stripe_customer_id text
stripe_subscription_id text

-- New: Usage tracking (or derive from release_drafts count)
-- Table: usage_records (user_id, month, draft_count)
```

---

### 3.3. Custom Brand Personas (Phase 2c)

**Feature:** User uploads 3–5 example posts. AI clones their writing style.

**Flow:**
1. Settings → "Brand Voice" → Upload 3–5 examples (paste text or upload)
2. Store in DB (new table: `brand_examples`)
3. Generation prompt: prepend examples as few-shot context; instruct model to match style, emojis, formatting

**Technical:** Few-shot prompting is simpler and sufficient for MVP. pgvector can be added later for semantic search over a larger example library.

**Schema:**

```sql
Table BrandExamples {
  id uuid [pk]
  user_id uuid [ref: > Users.id]
  content text
  platform text // 'linkedin', 'twitter', 'changelog'
  created_at timestamp
}
```

---

### 3.4. Direct Social Publishing (Phase 2d)

**Feature:** "Post to LinkedIn" and "Tweet" buttons that publish directly instead of copy.

**Flow:**
1. User connects LinkedIn/X in Settings (OAuth)
2. On review page: "Post to LinkedIn" / "Tweet" buttons
3. On click: call platform API with stored token

**Technical notes:**
- **LinkedIn:** OAuth 2.0; use Share API (UGC) or Marketing API. Requires app in LinkedIn Developer Portal.
- **X (Twitter):** OAuth 2.0 with PKCE; X API v2 `POST /2/tweets`. Requires Developer Account.
- **Token storage:** Encrypt `access_token` and `refresh_token` at rest. Use `refresh_token` before expiry.
- **Security:** Never expose tokens to client; all API calls server-side.

---

## 4. Updated Data Schema

```sql
-- Add to Users
ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'free';
ALTER TABLE users ADD COLUMN stripe_customer_id text;
ALTER TABLE users ADD COLUMN stripe_subscription_id text;

-- Add to Projects
ALTER TABLE projects ADD COLUMN is_active boolean DEFAULT true;
ALTER TABLE projects ADD COLUMN last_synced_at timestamptz;
ALTER TABLE projects ADD COLUMN github_installation_id bigint;

-- New: Social Integrations
CREATE TABLE social_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('linkedin', 'twitter')),
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- New: Brand Examples
CREATE TABLE brand_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  platform text CHECK (platform IN ('linkedin', 'twitter', 'changelog')),
  created_at timestamptz DEFAULT NOW()
);

-- Add to ReleaseDrafts
ALTER TABLE release_drafts ADD COLUMN scheduled_for timestamptz;
ALTER TABLE release_drafts ADD COLUMN published_at timestamptz;
ALTER TABLE release_drafts ADD COLUMN published_to text[]; -- ['linkedin', 'twitter']
ALTER TABLE release_drafts ADD COLUMN engagement_data jsonb DEFAULT '{}';
```

---

## 5. Out of Scope (V2) / Future

- **Team members (5 seats):** Requires invite flow, role management, org model. Defer to v3.
- **Weekly Newsletter Generator:** Needs separate spec (content format, delivery).
- **Custom AI Model Fine-tuning:** High complexity; consider "custom model" as a v3+ enterprise feature.
- **Engagement data sync:** Requires polling LinkedIn/X APIs; add post-launch.

---

## 6. Success Metrics for V2

- **Onboarding:** 80% of new users connect a repo within 3 minutes.
- **Conversion:** 5% Free → Paid within 30 days.
- **Retention:** Direct publishing users have 2x higher 30-day retention.
