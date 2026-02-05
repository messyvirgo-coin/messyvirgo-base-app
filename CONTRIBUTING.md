# Contributing to Market Vibe Daily

Thanks for your interest in contributing to **Market Vibe Daily**.

This repository is public and open-source for transparency and collaboration, but it is also an **official Messy Virgo product**. We use an **issues-first** workflow and maintainers retain editorial control over what gets merged.

## Ground rules

- **Be respectful**: follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
- **Keep it public-safe**: do not include secrets, personal data, private links, or confidential information.
- **No financial advice**: avoid content that reads like trading/investment recommendations.
- **No implied endorsement**: don’t use this repo to imply Messy Virgo endorses third parties without explicit approval.

## How to contribute (issues-first)

1. **Open an issue** describing the problem and proposed approach.
2. If it’s straightforward, you can open a PR immediately — but linking an issue helps avoid rework.
3. Maintainers may request edits, scope changes, or a different approach for product/legal consistency.

## Local development

Install dependencies:

```bash
npm install
```

Set environment variables (copy template):

```bash
cp .example.env .env.local
```

Run the app:

```bash
npm run dev
```

## Pull request checklist

- **Explain intent**: what problem does this solve and who is the audience?
- **Keep PRs focused**: one topic per PR when possible.
- **Run checks**: `npm run validate` (or at least `npm run lint` + `npm run typecheck`).
- **No secrets**: confirm you didn’t add keys/tokens or private URLs.
- **Respect trademarks/assets**: if you change product branding, see [NOTICE](./NOTICE.md) and [TRADEMARK](./TRADEMARK.md).

## Maintainers

- `@messy-michael`
- `@MessyFranco`
