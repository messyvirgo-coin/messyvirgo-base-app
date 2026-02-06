# Market Vibe Daily Base App

Daily crypto market intel: today's regime and risk context, plus what traders typically do next, summarized in about 2 minutes. Full report included. Educational only, not financial advice.

This is a Base Mini App that lives inside the Base Mobile App ecosystem (not a web-portal dApp). Open it here: [https://base.app/app/messyvirgo-base-macros.vercel.app/](https://base.app/app/messyvirgo-base-macros.vercel.app/). If you are not using the link, search the Base App for the title "Market Vibe Daily".

## TL;DR

Market Vibe Daily turns macro and liquidity signals into a clear daily regime call and risk posture. You get the base score, qualitative adjustment, and effective score with a regime label (R++, R+, N, R-, D), plus a short briefing and a link to the full report.

It is powered by our existing **Crypto Macro Economics Report** API. See the underlying app documentation for the full framework and indicator details: [https://www.messyvirgo.com/crypto-macro-economics-report.html](https://www.messyvirgo.com/crypto-macro-economics-report.html).

## Why use Market Vibe Daily?

- Save time with a daily briefing you can scan fast.
- Know the risk with a clear regime label and score breakdown.
- Get context for what usually works in this kind of regime.
- Open the full report when you want the deeper tables and notes.

## How to use it (Web UI)

Open Base Mini App ->

1) Acknowledge Terms and Privacy to unlock the report.
2) Read the daily briefing (regime, scores, summary).
3) Open the full report for detailed tables and annexes.
4) Download the report if you want a desktop-friendly view.

## What Market Vibe Daily does (high level)

### 1) Data ingestion (macro + liquidity context)

We pull the daily macro report output from the Messy Virgo pipeline and align it to a daily publish window. When available, the underlying signals are derived from trusted macro and liquidity sources (BIS, FRED, DeFiLlama, SoSoValue).

### 2) Regime scoring and labels

The report combines a weighted base score with a qualitative adjustment layer, then produces an effective score and a regime label:

- Base Score (BS): weighted macro and liquidity indicator score.
- Qualitative Adjustment (QA): current events overlay.
- Effective Score (ES): BS + QA, clamped to a stable range.
- Regime labels: R++ (strong risk on), R+ (risk on), N (neutral), R- (risk off), D (defensive).

### 3) Daily briefing + full report

The dApp surfaces a concise summary for fast reading, then links to the full report for deep detail. The full report typically includes:

- Regime snapshot and effective score.
- Indicator tables and base score breakdown.
- Qualitative adjustments and key drivers.
- Scenario notes and risk posture guidance.

### 4) Delivery and caching

Reports refresh daily and are cached briefly to speed up loading and avoid unnecessary re-fetches.

## Frequently Asked Questions

### Is this financial advice?

No. This is an educational data tool. Always do your own research.

### How often is the report updated?

Daily. Each report reflects the most recent available data at publish time.

### Can I share the report?

Yes. You can link to the report or download it for offline reading.

## Disclaimer

Market Vibe Daily uses best-effort data retrieval and automated analysis. Data may be incomplete or delayed, and interpretations can be wrong. This is for educational purposes only and is not financial advice.
