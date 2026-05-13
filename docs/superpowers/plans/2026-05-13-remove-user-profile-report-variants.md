# Remove User Profile Report Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove app-level report profile and variant selection while keeping exactly two report products: dashboard and full report.

**Architecture:** Replace arbitrary report variant strings with a fixed `MacroReportKind` union of `daily` and `default`. Keep the existing local proxy shape but rename its selection parameter to `report`, defaulting to `daily`; the proxy and client reject all other values.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest.

---

### Task 1: Lock API Behavior With Failing Tests

**Files:**

- Modify: `app/api/macro/messyVirgoApiClient.test.ts`
- Modify: `app/api/macro/_shared.test.ts`
- Modify: `app/api/macro/latest/route.test.ts`

- [ ] Update the upstream client test so dashboard fetch expects `https://api.messyvirgo.com/api/v1/public/reports/macro/report/daily`.
- [ ] Add a full report client test expecting `https://api.messyvirgo.com/api/v1/public/reports/macro/report/default`.
- [ ] Update local API shared parser tests so missing `report` defaults to `daily`, `report=default` is accepted, and an unsupported value returns an error.
- [ ] Update local route tests so `report=base_app` returns 400 and `report=default` calls the upstream client with `default`.
- [ ] Run `npm run test:ci` and confirm the new expectations fail before production code changes.

### Task 2: Replace Variants With Fixed Report Kinds

**Files:**

- Modify: `lib/messyVirgoApiClient.ts`
- Modify: `app/api/macro/_shared.ts`
- Modify: `app/api/macro/latest/route.ts`
- Modify: `app/api/macro/download/route.ts`
- Modify: `app/lib/useMacroReport.ts`

- [ ] Add `export type MacroReportKind = "daily" | "default"` and `DEFAULT_MACRO_REPORT_KIND = "daily"` in `lib/messyVirgoApiClient.ts`.
- [ ] Replace report path resolution so `getLatestDailyMacroReport("daily")` fetches `/report/daily` and `"default"` fetches `/report/default`.
- [ ] Replace `parseVariant` with `parseReportKind`, accepting only missing, `daily`, or `default`.
- [ ] Make cache helpers use report kind names in parameters and map keys.
- [ ] Update `/api/macro/latest` to call `parseReportKind` and `getLatestDailyMacroReport(kind)`.
- [ ] Update downloads and `useMacroReport` URLs to use `report=<kind>` instead of `variant=<variant>`.
- [ ] Run the targeted API tests and confirm they pass.

### Task 3: Remove Profile/Cadence UI Surface

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/full-report/page.tsx`
- Modify: `app/components/macro/MacroReportRenderer.tsx`
- Modify: `app/components/report/MacroReportHeaderCard.tsx`
- Modify: `app/components/SidebarNav.tsx`

- [ ] Set dashboard page report kind to `daily` and cache key to a daily-specific key.
- [ ] Set full report page report kind to `default`.
- [ ] Remove `macroProfileShortLabel`, `macroCadence`, `onMacroCadenceChange`, and `macroCadenceDisabled` props from `MacroReportRenderer`.
- [ ] Remove cadence toggle and profile-label props from `MacroReportHeaderCard`.
- [ ] Update sharing and download context in `SidebarNav` to use `reportKind` instead of `variant`.
- [ ] Run TypeScript checking to catch any remaining prop references.

### Task 4: Documentation And Verification

**Files:**

- Modify: `docs/architecture.md`
- Modify: `README.md`

- [ ] Update endpoint and report wording away from profile/variant selection.
- [ ] Search for remaining `base_app`, `variant`, `macroProfile`, and cadence-selection references.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:ci`.
- [ ] Run `npm run format:check`.
