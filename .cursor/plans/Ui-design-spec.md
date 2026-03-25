# UI Design Spec: Commitly AI

**Status:** Draft  
**Author:** (team)  
**Created:** 2026-03-24  
**Last Updated:** 2026-03-24  
**Inspiration:** Linear, Notion, Claude — **light UI reference:** Mind.GPT-style landing + dashboard (high-contrast monochrome, **violet** brand accents, **black** primary CTAs, light sidebar)  
**Related:**  
- [PRD v1 (MVP)](../../instructions.md)  
- [PRD v2 (production)](../../instructionsV2.md)  
- [AI codebase guide](../../AGENTS.md)

---

## Design Philosophy

Commitly AI should feel like a polished dev tool meets a calm writing surface — fast, trustworthy, and readable. The product turns raw GitHub activity into marketing-ready copy; the UI should signal **clarity and craft**, not dashboard noise. Borders stay light; elevation and typography do the hierarchy. Motion is quick. Dark mode is first-class.

**Core principles:**

- **Drafts and repos are the hero** — minimize chrome; spotlight connected work and generated content  
- **Monochrome base + violet accent** — near-white / cool-gray surfaces; **violet** (`#8B5CF6` / `#7C3AED`) for brand moments, active nav icons, links, and highlights — **not** for solid primary buttons  
- **Primary CTAs = black on white** — main actions use **solid black** (`#000000` or neutral-950) background and **white** text (reference: “Sign up” / “Start for free”); pair with a small white arrow icon where it helps velocity  
- **Secondary CTAs = outline** — white fill, **1px** light-gray border, **black** label (reference: “Login”)  
- **Shadows over heavy borders** — very soft, diffused shadow on large floating panels (e.g. dashboard preview); elsewhere prefer **1px** hairline `#E5E7EB`-style borders or background shifts; dark mode favors subtle borders over strong shadows  
- **Fast and snappy** — ~150ms hovers/transitions for UI chrome; longer easing only for progress or layout morphs  
- **Dense app chrome, spacious reading** — navigation and headers stay tight; review and long-form blocks breathe  
- **Keyboard-first where it helps** — Cmd/Ctrl+K command palette for navigation (aligned with power-user workflows)  
- **Dark mode from day one** — content and surfaces must work in both themes  

---

## Component Library

**shadcn/ui** (Radix primitives + Tailwind CSS v4) — components live under `src/components/ui` and are owned in-repo.

**Core components in use / to standardize on:**

- Button, Card, Badge, Input, Label, Textarea, Select  
- Dialog, Dropdown Menu, Tooltip, Separator  
- Tabs, Accordion, Collapsible (for expandable sections)  
- Sheet (mobile nav), Scroll Area  
- Command (for Cmd/Ctrl+K palette)  
- Skeleton (loading states)

Add only what a screen needs; prefer composition over new primitives.

---

## Color Palette

Map to CSS variables (`globals.css` / Tailwind theme). Today the app uses the **Zinc** shadcn preset (`oklch` tokens). The tables below match the **Mind.GPT-style reference**: cool neutrals, **violet** accents, **black** primary buttons. Alias to `--background`, `--primary`, `--sidebar-*`, etc., or add semantic names (`--bg-page`, `--cta-primary`, …) for clarity.

**Rules of thumb (light theme):**

- **Marketing / app chrome:** white and cool gray — not warm cream.  
- **Violet:** logos, icon highlights, active nav icon color, links, focus rings — **not** the default solid “submit” button fill.  
- **Black:** default **primary** button, high-priority single CTA per view.

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#FFFFFF` | Main marketing canvas, primary content well |
| `--bg-elevated` | `#F9FAFB` (gray-50) | Dashboard shell, preview areas behind white panels |
| `--bg-card` | `#FFFFFF` | Cards, modals, chat / review surfaces |
| `--bg-card-hover` | `#F3F4F6` (gray-100) | Row hover, subtle hover states |
| `--bg-subtle` | `#F3F4F6` / `#E5E7EB` | Inputs (“Ask me anything…” bar), inset wells, code blocks |
| `--text-primary` | `#000000` | Headlines, maximum emphasis |
| `--text-secondary` | `#111827` (gray-900) | Primary body when not pure black |
| `--text-muted` | `#374151` (gray-700) / `#6B7280` (gray-500) | Secondary body, descriptions, timestamps |
| `--text-faint` | `#9CA3AF` (gray-400) | Placeholders, disabled |
| `--border-subtle` | `#E5E7EB` (gray-200) | 1px dividers, outline buttons |
| `--border-hairline` | `#F3F4F6` | Very soft separators |
| `--accent` | `#8B5CF6` (violet-500) | Brand, links, active nav **icon**, focus |
| `--accent-hover` | `#7C3AED` (violet-600) | Accent hover |
| `--accent-muted` | `#F5F3FF` (violet-50) | Soft highlights, tier / AI badges |
| `--cta-primary` | `#000000` | **Solid primary button** background |
| `--cta-primary-text` | `#FFFFFF` | Text on primary button |
| `--cta-primary-hover` | `#18181B` (zinc-900) | Primary button hover (slightly soft black) |
| `--cta-secondary-bg` | `#FFFFFF` | Outline / ghost button fill |
| `--cta-secondary-text` | `#000000` | Outline button label |
| `--cta-secondary-border` | `#E5E7EB` | Outline button border |

### Dark Mode

Keep structure parallel; invert surfaces and CTA contrast.

| Token | Suggested value | Usage |
|-------|-----------------|-------|
| `--bg-page` | `#0A0A0A` / zinc-950 | Page background |
| `--bg-card` | `#18181B` (zinc-900) | Raised panels |
| `--bg-card-hover` | `#27272A` (zinc-800) | Hover |
| `--bg-subtle` | `#27272A` | Inputs, inset areas |
| `--text-primary` | `#FAFAFA` | Headings |
| `--text-secondary` | `#E4E4E7` | Body |
| `--text-muted` | `#A1A1AA` | Secondary copy |
| `--border-subtle` | `rgba(255,255,255,0.1)` | Dividers |
| `--accent` | `#A78BFA` (violet-400) | Accent on dark (slightly brighter) |
| `--accent-hover` | `#C4B5FD` (violet-300) | Accent hover |
| `--accent-muted` | `#2E1065` / violet-950 tint | Muted accent fills |
| `--cta-primary` | `#FAFAFA` (or white) | Primary button on dark |
| `--cta-primary-text` | `#000000` | Label on light button |
| `--cta-primary-hover` | `#E4E4E7` | Button hover |
| `--cta-secondary-bg` | transparent | Outline on dark |
| `--cta-secondary-text` | `#FAFAFA` | Outline label |
| `--cta-secondary-border` | `rgba(255,255,255,0.15)` | Outline border |

### Sidebar — **light** (default reference)

Per the reference frame, the app rail is **light**, not always-dark.

| Token | Value (light) | Usage |
|-------|----------------|--------|
| `--sidebar-bg` | `#FFFFFF` or `#F9FAFB` | Rail background |
| `--sidebar-text` | `#6B7280` | Inactive labels |
| `--sidebar-text-hover` | `#111827` | Hover label |
| `--sidebar-text-active` | `#000000` | Active label |
| `--sidebar-active-bg` | `#F3F4F6` | Active row **pill** background |
| `--sidebar-hover-bg` | `#F9FAFB` | Inactive row hover |
| `--sidebar-icon-active` | `#8B5CF6` | **Active item icon** (violet) |
| `--sidebar-icon-inactive` | `#9CA3AF` | Default icon stroke |

Inactive items: gray icon + gray text. Active item: **light gray pill** + **black** text + **violet** icon.

Optional **dark sidebar** for dark theme only: deepen `--sidebar-bg` to `#18181B`, lighten text tokens, keep `--sidebar-icon-active` as violet-400.

Align implementation with shadcn `--sidebar-*` variables where possible.

### Status & subscription (drafts + billing)

| Concept | Light | Dark | Notes |
|---------|-------|------|--------|
| Success / connected | Green 600 | Green 400 | GitHub connected, checkout success |
| Warning / limit | Amber 600 | Amber 400 | Approaching draft limit |
| Error / destructive | Red 600 | Red 400 | Form errors, destructive actions |
| Neutral / pending | `#9CA3AF` / gray-400 | zinc-500 | Placeholder / pending |
| Tier badge (Free / Founder / Team) | `--accent-muted` bg + `--accent` text | Deep violet tint + violet-400 text | Small pill; do not use black fill for badges |

**AI / brand avatar highlights** (e.g. icon in a circle): subtle **violet gradient or solid `#8B5CF6`** on white — matches reference “purple for AI” without replacing CTA black.

---

## Typography

| Element | Size | Weight | Line height | Letter spacing |
|---------|------|--------|-------------|----------------|
| Page title | 24px | 600 | 1.2 | -0.02em |
| Section heading | 16px | 600 | 1.4 | -0.01em |
| Card title | 14–15px | 500–600 | 1.4 | 0 |
| Body | 14px | 400 | 1.6 | 0 |
| Small / labels | 12px | 500 | 1.4 | 0.01–0.02em |
| Marketing hero | 36–40px | 600 | 1.15 | -0.03em |
| Long-form / changelog preview | 15–16px | 400 | 1.75 | 0 |
| Code / commits | 13px (Geist Mono) | 400 | 1.6 | 0 |

**Fonts:** Geist Sans + Geist Mono (see `src/app/layout.tsx`). Keep mono for commit SHAs and technical blocks. **Weight:** marketing headlines **semibold/bold** with **tight letter-spacing** (reference: high-contrast, confident sans).

---

## Layout: App Shell

```
┌────────────────────────────────────────────────────────┐
│ ┌────────┐ ┌────────────────────────────────────────┐ │
│ │        │ │ Breadcrumbs / context      [⌘K]  user  │ │
│ │Sidebar │ ├────────────────────────────────────────┤ │
│ │~200px   │ │                                        │ │
│ │(opt.)   │ │  Content (max-w-4xl typical)           │ │
│ │         │ │  px-6–8 py-6–12                        │ │
│ │         │ │                                        │ │
│ │[user]   │ │                                        │ │
│ └────────┘ └────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Current state:** Dashboard, Settings, Billing, and Review use a **full-width top header** + centered `max-w-4xl` main. **Target state:** optional left sidebar for primary nav; header for context, search, account.

### Sidebar (target) — compact, **light rail**

- **Nav items:** ~32px row height; Lucide **16px**, stroke ~1.5px (thin, minimal) + label ~13px, 8px gap  
- **Primary routes:** Dashboard, Billing, Settings  
- **Logo / wordmark:** “Commitly AI” + mark top-left; optional **violet** gradient or icon treatment on the logo mark only  
- **Active state:** **`--sidebar-active-bg`** pill (light gray), **black** label, **violet** active icon — not a dark sidebar strip  
- **Bottom:** user menu (avatar or email) + sign out  
- **Mobile:** Sheet from hamburger; sidebar hidden `<768px`

### Header bar

- **Left:** back link or breadcrumb (`Dashboard`, `Settings`, `Review / {repo}`)  
- **Right:** theme toggle (if manual theme), Cmd/Ctrl+K trigger, account actions  
- **Height:** ~48px; bottom border `border-subtle`  
- **Sticky:** optional within content column for long review pages

### Content area

- **Background:** **`--bg-elevated`** (`#F9FAFB`) behind white panels, or `--bg-page` white when full-bleed — matches reference dashboard preview separation  
- **Max width:**  
  - Dashboard / Settings / Billing: `max-w-4xl`  
  - Review (long copy): `max-w-3xl` for changelog/social columns readability  
- **Padding:** `px-6 py-10–12` desktop; tighten on mobile  

---

## Cmd/Ctrl+K Command Palette

Centered dialog, autofocus search, keyboard navigation.

**Actions (MVP set):**

- Go to Dashboard  
- Go to Billing  
- Go to Settings  
- Open GitHub app install (external)  
- Toggle theme (when `next-themes` or equivalent is wired)  
- Sign out (confirm optional)

**Design:**

- Backdrop blur + dim  
- Rounded command input; results with icon + label + shortcut hints  
- Open: scale 0.95 → 1, opacity 0 → 1, **~150ms**  
- Close: reverse or instant fade per shadcn Command pattern  

---

## Page Designs

### 1. Home (`/`)

Pre-auth marketing; no app sidebar.

- **Hero:** centered, `max-w-2xl`; clean background (no loud gradient)  
- **Headline:** product value — e.g. turning GitHub work into release notes and social posts  
- **Subcopy:** one short paragraph, `--text-secondary`  
- **CTAs:** **Primary** = black solid + white text + optional small **white** arrow icon (“Start for free” pattern); **Secondary** = white + `#E5E7EB` border + black text (“Login” pattern). Use **violet** only for logo / small highlights, not the main hero button fill.  
- **Signed-in:** single prominent “Go to Dashboard” — use **black primary** button styling  
- **Footer note:** optional tiny muted line (tier, trust, or “GitHub required”)  

### 2. Sign in / Sign up (`/signin`, `/signup`)

No sidebar; narrow column.

- **Width:** `max-w-sm` to `max-w-md`  
- **Brand:** small Commitly AI mark + name, muted  
- **Card or flat form:** email/password or OAuth providers per `auth.ts`  
- **Errors:** inline, destructive color; no alert clutter  
- **Links:** forgot password, switch sign-in/sign-up  

### 3. Forgot / reset password (`/forgot-password`, `/reset-password`)

Same shell as sign-in: minimal, trustworthy, single task per screen.

### 4. Dashboard (`/dashboard`)

App shell.

- **Greeting:** “Welcome, {name}” — page title scale; optional first-name only  
- **Status row:** onboarding (DB/GitHub), **drafts used this month** vs limit, subscription tier — prefer **inline stats** or slim badges over heavy stat cards  
- **Connected repos:** list or compact rows (repo name, optional full name); clear empty state with CTA to install GitHub App  
- **Connect card:** single primary “Connect GitHub”; advanced path collapsed (Accordion/`details`)  
- **Recent drafts:** list rows (repo + date); click → `/dashboard/review/[id]`; hover reveal chevron or “Open”  
- **Upgrade prompt:** when at limit, text link to Billing (**violet** link or black underline-on-hover — pick one pattern per screen and stay consistent)  

### 5. Billing (`/dashboard/billing`)

- **Title + short explanation** of Free vs Founder vs Team  
- **Current plan** badge; usage summary if shown  
- **Actions:** Upgrade = **black primary**; Manage billing = **outline secondary** (white + gray border)  
- **Trust:** short note on secure payment; no dark patterns  

### 6. Settings — Brand voice (`/dashboard/settings`)

- **Section header:** “Brand voice” with Mic icon  
- **Explanation:** one paragraph on few-shot examples  
- **Form:** platform toggles (LinkedIn / Twitter / changelog examples), add/remove rows, save feedback  
- **Empty state:** gentle copy that default tone will apply  

### 7. Review draft (`/dashboard/review/[logId]`)

Focus mode for reading and copying.

- **Header:** repo name + date; back to Dashboard  
- **Structure:**  
  - “Before” — original commits in mono list, subtle card  
  - “Generated” — tabs or stacked sections: Changelog, LinkedIn, Twitter (array), each in readable prose styling  
- **Actions:** per-block Copy buttons (already present); consider sticky mini toolbar on large screens  
- **Typography:** generated body slightly larger line-height for scanability; links **`--accent`** (violet), underline on hover only if desired  
- **Long content:** plain text + generous padding; avoid heavy chat bubbles — reference is **avatar + text** simplicity  

### 8. GitHub OAuth callback (`/dashboard/github/callback`)

- **Minimal:** success / error message, link back to Dashboard  
- **No heavy chrome** — user is mid-flow  

---

## Micro-Interactions & Polish

### Border radius

Major buttons, cards, inputs, and modals: **`rounded-xl`–`rounded-2xl`** (about **10–16px**) — highly rounded, Mind.GPT-style, not sharp corners.

### Shadows vs borders

- **Large floating panel** (e.g. product screenshot / dashboard preview on landing): **one** soft, **diffused** shadow — e.g. `0 24px 80px rgba(0,0,0,0.06)` or similar — layered over `#FFFFFF` page  
- **Light cards in-app:** very soft shadow **or** `1px` `--border-subtle` only; hover = slightly deeper shadow or `--bg-card-hover`  
- **Dark mode:** prefer `border-border` / `--border-subtle` over strong shadows  
- **Modals/menus:** stronger elevation than inline cards  
- **Inputs:** light gray fill (`--bg-subtle`), **rounded-xl**, minimal inner chrome (reference command bar)  

### Loading

- Prefer **Skeleton** over raw “Loading…” text  
- Dashboard: greeting + stat placeholders + one card skeleton  
- Review: title bar + blocks for each content section  

### Transitions

- **Hover:** `transition-colors duration-150` (or `transition-all` sparingly)  
- **Page enter:** optional 150ms opacity + 4px translate (subtle)  
- **Progress bars:** animate width on mount ~400–500ms ease-out  

### Hover-to-reveal

- Draft list: secondary action or chevron on hover  
- Repo rows: “Disconnect” or meta only when relevant (avoid clutter)  

---

## Responsive Behavior

### Desktop (>1024px)

- Full sidebar if implemented; comfortable `max-w-*` content  

### Tablet (768px–1024px)

- Icon-only sidebar + tooltips, or collapsed top nav  

### Mobile (<768px)

- Hamburger + Sheet for nav  
- Stack cards and forms single-column  
- Review page: full-width copy; copy buttons remain thumb-friendly  
- Reduce horizontal padding (`px-4`) where needed  

---

## Icons (Lucide React)

**Style:** default to **thin, minimal stroke** (e.g. `strokeWidth={1.5}` where supported) for sidebar and chrome — matches reference line icons.

| Usage | Icon | Size |
|-------|------|------|
| Product / logo accent | `Sparkles` (often **violet** or gradient circle) | 20–24px (hero), 16px (chrome) |
| Dashboard | `LayoutDashboard` | 16px |
| Draft / document | `FileText` | 16px |
| Settings | `Settings` | 16px |
| Billing / plan | `CreditCard` | 16px |
| Brand voice | `Mic2` | 16–20px |
| GitHub | Octicon or branded SVG | 16–20px |
| Back | `ArrowLeft` | 16px |
| Sign out | `LogOut` | 16px |
| Search / command | `Search` | 16px |
| Menu (mobile) | `Menu` | 20px |
| External link | `ExternalLink` | 14px |
| Copy | `Copy` / `Check` | 14–16px |

---

## Dark Mode Implementation

- **Today:** `prefers-color-scheme` drives `.dark` tokens in `globals.css`  
- **Target:** add **`next-themes`** (or equivalent) for explicit light/dark/system + persistence  
- **Command palette + settings:** expose “Toggle theme”  
- **Sidebar:** default reference is **light sidebar in light mode**; in dark mode use dark rail tokens above while keeping **violet** for active icon  
- **Charts (future):** use chart tokens already in theme  

---

## Implementation Order

1. Align semantic tokens: **white / gray-50 page split**, **violet accent**, **black `cta-primary`**, **light sidebar** — map into Tailwind `@theme` / CSS variables  
2. Introduce optional app shell: sidebar + shared header component used by dashboard routes  
3. Command palette (shadcn Command) + shortcuts registry  
4. Refine Dashboard: stats row, repo list, draft list, connect card  
5. Refine Review page: typography scale, tabbed generated content, copy affordances  
6. Refine Settings brand voice layout and empty states  
7. Refine Billing hierarchy and CTAs  
8. Refine marketing home + auth pages for consistency  
9. Loading skeletons across dashboard subtree  
10. Responsive pass (Sheet, padding, sidebar collapse)  
11. Theme toggle + dark-mode polish (contrast, borders vs shadows)  

---

## Notes on Product Constraints

- **GitHub webhook latency:** UI should never imply instant draft; optional “processing” states when async jobs exist  
- **Subscription limits:** surface `canCreateDraft` / `canConnectRepo` messaging near actions, not only on Billing  
- **Multi-repo:** keep repo selection and list scannable as count grows  

This spec is a north star for visual and UX consistency; incremental PRs can land individual sections without blocking on the full shell migration.
