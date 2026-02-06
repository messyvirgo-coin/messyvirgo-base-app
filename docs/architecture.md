# Architecture

## Overview

Market Vibe Daily is a Base Mini App built with Next.js (App Router). It serves a Farcaster Mini App manifest, renders a daily macro briefing, and pulls report data from the Messy Virgo Macro Economics Report API.

## Runtime boundaries

- **Client (browser / Base App webview)**:
  - `app/page.tsx` (daily briefing)
  - `app/full-report/page.tsx` (full report view)
  - `app/lib/useMacroReport.ts` (client fetch + localStorage cache)
  - `app/components/macro/*` (rendering + markdown UI)
  - `app/components/LegalAcknowledgementOverlay.tsx` (terms gate)
- **Server (Next.js API routes)**:
  - `app/.well-known/farcaster.json/route.ts` (Mini App manifest)
  - `app/api/macro/latest/route.ts` (JSON report)
  - `app/api/macro/download/route.ts` (downloadable markdown)
  - `app/api/webhook/route.ts` (signed webhook receiver)
  - `lib/messyVirgoApiClient.ts` (upstream API client)

## High-level data flow

1) User opens the Base Mini App (Base App webview).
2) Legal acknowledgement gate opens on first visit.
3) Client calls `GET /api/macro/latest?variant=base_app`.
4) Server fetches the latest report from the Messy Virgo API and caches it.
5) Client renders a daily briefing and header scores from markdown artifacts.
6) Optional: user downloads the report via `GET /api/macro/download`.

## Entry points

- **Base App URL**: `https://base.app/app/messyvirgo-base-macros.vercel.app/`
- **Daily briefing**: `/` (variant `base_app`)
- **Full report**: `/full-report` (variant `default`)
- **Manifest**: `/.well-known/farcaster.json`

## Key flows

### 1) Manifest + Mini App identity

`minikit.config.ts` defines the Mini App metadata (name, description, images, tags). The manifest is served at `/.well-known/farcaster.json` using `withValidManifest(...)`. Domain guardrails ensure `NEXT_PUBLIC_URL` stays consistent with the `accountAssociation` payload.

### 2) Report retrieval (JSON)

`/api/macro/latest`:

- Validates `variant` via `parseVariant(...)`.
- Fetches data from the upstream API using `getLatestDailyMacroReport(...)`.
- Caches the response in an in-memory TTL cache (1 hour).
- Returns `PublishedMacroReportResponse` JSON.

### 3) Client caching + render

`useMacroReport(...)`:

- Loads cached report from `localStorage` when fresh.
- Otherwise fetches `/api/macro/latest`.
- Passes outputs to `MacroReportRenderer`, which extracts markdown and scores.

### 4) Report download (Markdown)

`/api/macro/download`:

- Fetches the same cached report as above.
- Extracts markdown artifacts and assembles a single markdown file.
- Returns a file download with a variant-specific filename.

### 5) Webhook receiver

`/api/webhook`:

- Requires `MINIKIT_WEBHOOK_SECRET` or `WEBHOOK_SECRET`.
- Verifies HMAC SHA-256 signature (timing-safe compare).
- Enforces a 256 KiB payload limit.

## Data model (core)

- `PublishedMacroReportResponse`
  - `outputs: LensOutputArtifact[]`
  - `meta` (publish time, staleness, etc.)
- `LensOutputArtifact`
  - `kind: "markdown" | "json" | "pdf" | "webhook"`
  - `content` (markdown string or structured markdown object)

## Caching strategy

- **Server**: bounded in-memory TTL cache (1 hour, max 50 variants).
- **Client**: `localStorage` TTL cache (1 hour) to avoid repeat fetches.

## External dependencies

- **Messy Virgo API** (Macro Economics Report): `https://api.messyvirgo.com`
- **Mini App docs** (framework details): `https://www.messyvirgo.com/crypto-macro-economics-report.html`
- **OnchainKit / MiniKit** for Farcaster Mini App manifest helpers.

## Configuration

- `NEXT_PUBLIC_URL` (canonical app URL)
- `NEXT_PUBLIC_BASE_APP_ID`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `MESSY_VIRGO_API_BASE_URL` (optional; defaults to `https://api.messyvirgo.com`)
- `MESSY_VIRGO_API_KEY` / `MESSY_VIRGO_API_TOKEN` (optional auth)
- `MINIKIT_WEBHOOK_SECRET` or `WEBHOOK_SECRET` (webhook HMAC)
