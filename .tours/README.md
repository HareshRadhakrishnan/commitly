# Code Tours

Interactive walkthroughs of Commitly's key flows. Tours teach system behavior, not just file locations.

---

## Tour Index

| Tour | Flow | Entry File |
|------|------|------------|
| [github-push-to-draft.tour](github-push-to-draft.tour) | GitHub push → Inngest → AI → draft → email | `src/app/api/webhooks/github/route.ts` |
| [authentication-session.tour](authentication-session.tour) | Sign in (credentials/OAuth) → session → user sync | `src/app/api/auth/[...nextauth]/route.ts` |
| [dashboard-repo-connect.tour](dashboard-repo-connect.tour) | GitHub App install → repo list → connect | `src/app/dashboard/page.tsx` |
| [stripe-subscription.tour](stripe-subscription.tour) | Upgrade → Stripe Checkout → webhook → tier update | `src/app/dashboard/billing/page.tsx` |
| [brand-voice-examples.tour](brand-voice-examples.tour) | Add examples → stored → used in AI generation | `src/app/dashboard/settings/page.tsx` |

---

## How to Use

### Option 1: CodeTour Extension (Recommended)

1. Install the **CodeTour** extension: [vsls-contrib.codetour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour)
2. Open this workspace in VS Code or Cursor
3. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
4. Run "CodeTour: Start Tour"
5. Select a tour from the list

### Option 2: Manual Reading

Tour files are JSON. Open any `.tour` file to see:
- `steps[]`: ordered list of stops
- Each step has: `file`, `line`, `title`, `description`

Navigate to each file/line manually and read the descriptions.

---

## Maintenance Notes

**Line numbers may drift** after code edits. If a tour step points to the wrong line:

1. Open the `.tour` file
2. Find the step
3. Update the `"line"` value to the correct location
4. Consider using method/function names in descriptions so readers can find the right spot even if line numbers are off

**When to update tours:**
- After significant refactors
- When adding new steps to a flow
- When file paths change

---

## See also

- [AGENTS.md](../AGENTS.md) — Task router for finding where to start
- [docs/canonical-examples.md](../docs/canonical-examples.md) — Copy-paste patterns
- [docs/verification.md](../docs/verification.md) — How to test changes
