# Market Vibe Daily

**Market Vibe Daily** is a Farcaster Mini App that publishes **daily crypto market intel**: today’s regime + risk context and what traders typically do next, summarized in ~2 minutes (with a full report link). **Educational only — not financial advice.**

- **Name**: Market Vibe Daily
- **Subtitle**: by Messy Virgo / MESSY
- **Tagline**: Know the vibe. Trade smarter.
- **Primary category**: Finance

## Live / Hosting

- **Hosting**: Vercel (currently under a personal profile; this is temporary)
- **Vercel project (temporary dashboard link)**: `https://vercel.com/michaels-projects-4f272b86/messyvirgo-base-app`

## Tech stack

- **Framework**: Next.js (App Router)
- **UI**: Tailwind CSS
- **Mini App**: Farcaster Mini App manifest + MiniKit
- **Onchain**: OnchainKit, wagmi, viem (as needed)

## Repo layout (high level)

- **Mini App manifest**: served from `/.well-known/farcaster.json` via `app/.well-known/farcaster.json/route.ts`
- **Mini App metadata/config**: `minikit.config.ts`
- **API routes**: `app/api/*` (including `app/api/webhook/route.ts`)
- **Legal content**: `content/legal/*` and pages under `app/privacy`, `app/terms`

## Getting started (local dev)

### Prerequisites

- Node.js 20+ recommended
- npm

### Clone

```bash
git clone <YOUR_REPO_URL>
cd messyvirgo-base-app
```

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` (recommended: copy from `.example.env`):

```bash
cp .example.env .env.local
```

Then set the required values:

- **`NEXT_PUBLIC_URL`**: **required** canonical production URL (e.g. `https://your-domain.com`)
- **`NEXT_PUBLIC_BASE_APP_ID`**: required for Base app metadata
- **`NEXT_PUBLIC_ONCHAINKIT_API_KEY`**: required for OnchainKit provider

Optional:

- **`MESSY_VIRGO_API_BASE_URL`**: defaults to `https://api.messyvirgo.com`
- **`MESSY_VIRGO_API_KEY`**, **`MESSY_VIRGO_API_TOKEN`**: reserved for future auth

> [!IMPORTANT]
> For Mini Apps, best practice is to set `NEXT_PUBLIC_URL` to the **same canonical production URL** in **both Vercel Production and Preview** environments. This keeps your manifest domain-consistent with `accountAssociation` and avoids preview “Ready” failures caused by domain mismatches.

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Deployment (Vercel)

1. **Deploy**

```bash
vercel --prod
```

2. **Set environment variables** in Vercel (Production, and also Preview where noted):

- `NEXT_PUBLIC_URL` (**set the canonical prod URL in both Production + Preview**)
- `NEXT_PUBLIC_BASE_APP_ID`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`

## Farcaster account association (Mini App publishing)

The manifest is domain-bound. After you have a stable domain:

1. Generate/sign `accountAssociation` using the [Farcaster manifest tool](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Paste the generated `accountAssociation` into `minikit.config.ts`
3. Redeploy

You can validate embeds/manifest readiness at [base.dev/preview](https://base.dev/preview).

`minikit.config.ts` includes guardrails to warn/error on domain mismatches between `NEXT_PUBLIC_URL` and the signed `accountAssociation` payload domain.

## Updating the Mini App metadata

Edit `minikit.config.ts` (fields like `miniapp.name`, `miniapp.description`, images, tags). The manifest is served from `/.well-known/farcaster.json` and reflects this config.

## Base app registration notes

- This app is registered with the **Base team account**: **team@messyvirgo**

## Contributing

- Please open an issue or PR with a clear description and screenshots where relevant.
- Do not commit secrets. Keep local values in `.env.local` (this repo ships `.example.env` as a template).

## License

- **Code**: Apache-2.0 (see [LICENSE](./LICENSE))
- **Brand assets & trademarks**: reserved (see [NOTICE](./NOTICE.md) and [TRADEMARK](./TRADEMARK.md))

## Disclaimer

This repository and app are provided **as-is** for informational/educational purposes. Nothing here constitutes financial, investment, legal, or tax advice.
