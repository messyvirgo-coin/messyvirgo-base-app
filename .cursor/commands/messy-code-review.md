## Messy Virgo Mini App — Code Review Workflow (Cursor)

You are reviewing a **Next.js 15 / React 19** mini app built with **OnchainKit + MiniKit** and deployed to the Base app / Farcaster ecosystem. Your job is to surface issues that will cause **real product bugs, security leaks, reliability problems, or long-term maintenance pain**.

- **Only report HIGH and MEDIUM priority issues.** Ignore cosmetic style prefs.
- **Be concrete:** cite exact files and lines, explain impact, and give step-by-step fixes.

### What this repo is (architecture map)

Use this mental model while reviewing:

- **Routing (Next.js App Router):** `app/**/page.tsx`, `app/layout.tsx`
- **Route handlers (server):** `app/api/**/route.ts`, `app/.well-known/**/route.ts`
- **UI components (mostly client):** `app/components/**`
- **Client-safe “domain/util” code:** `app/lib/**` (types, formatting, profile storage, lens parsing)
- **Server-only integrations:** `lib/**` (notably `lib/messyVirgoApiClient.ts` uses `server-only` + env secrets)
- **Mini App manifest config:** `minikit.config.ts` (served by `app/.well-known/farcaster.json/route.ts`)
- **Static assets:** `public/**`

### Choose your review mode

This workflow supports two modes:

- **Mode A — Change/PR review**: review only what changed (fast, best for PRs).
- **Mode B — Full app audit**: review the entire repo as a system (slower, best for “is the app healthy?”).

Pick one mode and follow the steps for that mode.

---

## Mode A — Change/PR review

### Step A1: Identify changed files (the review scope)

Run:

```bash
git status
git log --oneline -10
git diff --name-status HEAD
```

Then list changes grouped as:

- Modified
- Added
- Deleted

### Step A2: Intent + user-facing behavior

Before nitpicking, answer (from diffs + code):

- What user-visible behavior changed? (Dashboard / profile flow / macro report rendering / navigation)
- Does the change impact the **Mini App manifest**, **frame metadata**, or **Base app integration**?
- Is the change client-only, server-only, or cross-cutting?

### Step A3: Next.js correctness (App Router)

Review every changed file with these **Next.js-specific** checks:

#### Client vs server boundaries (HIGH)

- **Client components** must have `"use client"` at the top _only when needed_ (hooks, browser APIs).
- **Never import server-only modules into client code.**
  - `lib/messyVirgoApiClient.ts` is `server-only` by design; importing it into `app/**` client components should fail the build (or worse, leak secrets).
- **Environment variables:**
  - Only `NEXT_PUBLIC_*` may be read in client components.
  - Secrets (e.g., `MESSY_VIRGO_API_KEY`, `MESSY_VIRGO_API_TOKEN`) must stay on the server (route handlers / server-only modules).

#### Route handlers (`app/api/**/route.ts`) (HIGH/MED)

- Validate inputs (query params, body) and return **consistent JSON error shapes**.
- Don’t accidentally enable caching for “latest” endpoints.
  - Prefer `cache: "no-store"` upstream + `Cache-Control: no-store` downstream.
  - If using `export const dynamic = "force-dynamic"`, confirm it’s intentional.
- Ensure `runtime` is correct (`nodejs` when using node-only deps or secrets).

#### Metadata / frames (MED)

- `generateMetadata()` should not log secrets; debug logging must be dev-only.
- Ensure `fc:frame` metadata stays valid JSON and matches the app’s UX (button title/action).

### Step A4: MiniKit / OnchainKit specifics

Check these integration points carefully:

- **`RootProvider`** (`app/rootProvider.tsx`):
  - `OnchainKitProvider` is configured with `NEXT_PUBLIC_ONCHAINKIT_API_KEY` and `miniKit.enabled`.
  - Missing env values should fail _predictably_ (clear error, not blank screen loops).
- **Safe area + mobile UX**:
  - UI should respect `SafeArea` and `env(safe-area-inset-bottom)` usage (especially nav overlays).
- **Manifest:** `app/.well-known/farcaster.json/route.ts` should serve `withValidManifest(minikitConfig)` and the config should reference valid assets under `public/`.

### Step A5: App “domain” behavior (what this app does)

This app’s core behaviors to protect in review:

- **Profile selection + onboarding**
  - Profile is persisted in `localStorage` keyed by **FID** (with anonymous fallback/migration).
  - The onboarding gate should not trap users on settings routes.
  - Cross-tab/profile-change reactivity should remain correct (`storage` + custom event).

- **Macro report fetching + rendering**
  - Client fetches `GET /api/macro/latest?profile=...` and renders markdown artifacts.
  - Ensure abort/cancellation logic prevents stale responses from flashing.
  - Ensure markdown rendering stays safe (no raw HTML injection) and handles missing/partial artifacts gracefully.

### Step A6: Reliability, security, and performance (prioritize impact)

Flag as HIGH/MED when you see:

- **Security:** secrets in client bundles, unsafe dynamic HTML, leaking stack traces in production, overly-verbose error details in prod responses.
- **Reliability:** missing error handling, inconsistent error JSON, unbounded retries/loops, flaky UI state, missing null checks for MiniKit context.
- **Performance:** unnecessary `"use client"` on large trees, heavy computations on every render without memoization, avoidable re-renders, oversized images without `next/image` where appropriate.

### Step A7: “Testing” expectations in this repo

This repo currently doesn’t appear to have a test suite. Don’t demand tests for everything, but do flag **HIGH/MED** risk changes that are easy to regress.

- If change is risky, propose a **minimal** test strategy:
  - **E2E/manual test plan** steps
  - Or a small unit test harness suggestion if/when the repo adopts one

### Step A8: Basic checks to run (when relevant)

If the change is non-trivial, recommend (and/or run) the standard checks:

```bash
npm run lint
npm run build
```

---

## Mode B — Full app audit (review the whole app)

Use this mode when you want to assess the repo holistically (architecture clarity, integration correctness, security posture, reliability).

### Step B1: Inventory the repo (what exists)

Run:

```bash
git ls-files
```

Then summarize (high level):

- Routes/pages in `app/**`
- Route handlers in `app/api/**`
- Shared utilities/types in `app/lib/**`
- Server-only integrations in `lib/**`
- Manifest + metadata config (`minikit.config.ts`, `app/.well-known/**`)
- Key UI surfaces (`app/components/**`)

### Step B2: Build a “system map” (how data flows)

Describe the main runtime paths (as they exist today):

- **Mini App manifest**: `minikit.config.ts` → `app/.well-known/farcaster.json/route.ts`
- **Dashboard**: `app/page.tsx` → `GET /api/macro/latest` → `lib/messyVirgoApiClient.ts` → upstream API
- **Profile**: MiniKit FID → profile storage (`app/lib/profile.ts`) → onboarding gate and UI

### Step B3: Run baseline health checks (HIGH signal)

```bash
npm run lint
npm run build
```

If these fail, treat it as HIGH priority unless it’s clearly a known/accepted limitation.

### Step B4: Security + env var audit (HIGH)

Verify:

- No secrets are ever read in `"use client"` components (only `NEXT_PUBLIC_*` on client).
- `lib/messyVirgoApiClient.ts` (server-only) is only imported from server contexts (route handlers, server components).
- Error responses do not leak sensitive details in production (guard on `NODE_ENV`).

Optional quick checks:

```bash
rg "process\\.env\\.(?!NEXT_PUBLIC_)"
rg "MESSY_VIRGO_API_KEY|MESSY_VIRGO_API_TOKEN"
rg "\"use client\""
```

### Step B5: Route handler audit (`app/api/**/route.ts`)

For each handler:

- Input validation and clear error messages (consistent JSON shape)
- Caching behavior is explicit (especially “latest” endpoints)
- Runtime is appropriate (`nodejs` when using server-only/secrets)
- Timeouts/abort behavior is sensible for upstream calls

### Step B6: UI/UX audit for Mini App constraints

Check:

- Safe area correctness (`SafeArea`, `env(safe-area-inset-bottom)`)
- Overlay/drawer accessibility (Escape close, focus/scroll locking, ARIA)
- Loading/empty/error states are present and readable on small screens
- Images use `next/image` where beneficial and sizes are correct

### Step B7: “Domain behavior” audit (macro reports + profiles)

Check:

- Profile selection is resilient (FID missing, anonymous fallback, migration)
- Macro report rendering is robust to partial artifacts (missing header/body/meta)
- Markdown rendering is safe (no raw HTML unless intentionally allowed)

### Step B8: Recommend follow-ups (MED)

If there is no test suite, propose a minimal path:

- A short manual test checklist (fast to run before release)
- Optional: add a lightweight unit/e2e framework later (only if the app’s risk warrants it)

---

## Output format

Write your review using exactly this structure:

```markdown
## Code Review Report

### Review mode

- Mode: A (Change/PR) | B (Full app audit)

### Repo/system overview (Mode B only)

- Purpose: ...
- Key flows: ...

### Changed files

- Modified: [...]
- Added: [...]
- Deleted: [...]

### High priority issues

#### [Title]

**Location:** `path/to/file.tsx:line-range`
**Impact:** ...
**Why it’s a problem:** ...
**Fix (explicit steps):**

1. ...
2. ...

### Medium priority issues

#### [Title]

...same format...

### Good calls (keep these)

- ...

### Suggested test plan (only if needed)

- ...

### Summary

- Total issues: X (Y high, Z medium)
- Must-fix before merge: [...]
```

## Reviewer checklist

- [ ] All changed files examined
- [ ] Client/server boundaries validated (`"use client"`, `server-only`, env vars)
- [ ] Route handlers reviewed (validation, caching, runtime, errors)
- [ ] MiniKit/manifest impacts checked (`minikit.config.ts`, `.well-known` route)
- [ ] Only HIGH/MED issues reported with explicit fixes
