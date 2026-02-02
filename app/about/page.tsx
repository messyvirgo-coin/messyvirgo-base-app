"use client";

import { Globe, Twitter, MessageCircle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";

export default function AboutPage() {

  return (
    <PageShell mainClassName="gap-8">
      <div className="w-full max-w-4xl mx-auto space-y-12">
        <PageHeader
          title="About"
          subtitle={
            <>
              We believe in a world where the most powerful financial tools aren&apos;t
              reserved for insiders, but are transparent, AI‑driven, and simple enough
              for anyone to use—governed on‑chain by the very people whose future they
              help shape.
            </>
          }
        />
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[rgb(255,105,180)]">
              About the report
            </h2>
            <p className="text-base font-medium text-foreground max-w-2xl mx-auto">
              A quantitative framework for translating macro & liquidity into
              clear crypto positioning guidance.
            </p>
          </div>
          <div className="mv-card rounded-lg p-6 sm:p-8">
            <div className="space-y-3 text-sm text-foreground/90">
              <p>
                The Crypto Macro Economics Report ingests 13 macro and liquidity
                indicators from trusted sources (including BIS, FRED, DeFiLlama,
                and SoSoValue), normalizes each into a comparable signal, and
                aggregates them into a weighted base score to summarize the
                current regime.
              </p>
              <p>
                It then applies a structured current-events overlay to produce an
                effective score and regime label (from strong risk-on to
                defensive), and translates that into actionable sizing guidance
                across four buckets: stablecoins, majors (BTC/ETH), high-beta
                alts, and micro/long-tail assets. Reports refresh daily, are
                shareable, and are for educational research—not financial advice.
              </p>
              <div className="pt-1">
                <a
                  href="https://www.messyvirgo.com/crypto-macro-economics-report.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[rgb(255,105,180)] hover:text-[rgb(255,105,180)]/80 transition-colors"
                >
                  <span>Read the full methodology</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[rgb(255,105,180)]">
              About Messy Virgo
            </h2>
            <p className="text-base font-medium text-foreground max-w-2xl mx-auto">
              Building your friendly AI fund agent for small- and mid-cap crypto. Powered by $MESSY on Base.
            </p>
          </div>
          <div className="mv-card rounded-lg p-6 sm:p-8">
            <div className="space-y-4 text-sm text-foreground/90">
              <p>
                She appears as a playful anime mascot, but &quot;Messy&quot; is actually an AI strategist that learns
                from data, tests theories, and publishes results.
              </p>
              <p>
                She starts as a research assistant with dashboards and evolves
                into an on-chain AI fund agent, with $MESSY as the token linking
                you to her tools and future.
              </p>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">$MESSY Token</h3>
                <p>
                  Base-native token powering the ecosystem—audited (CertiK
                  templates, Bitbond Token Tool, SOLIDProof) and team‑KYC&apos;d
                  for a secure foundation.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">What we&apos;re building</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <span className="font-medium">Due Diligence Engine:</span>{" "}
                    Real-time signal detection across social, news, and on-chain
                    data—plus automated AI project analysis and fundamentals
                    scoring to surface real opportunities.
                  </li>
                  <li>
                    <span className="font-medium">AI Fund Agent:</span> Portfolio
                    construction and optimization algorithms that manage positions
                    end-to-end—balancing risk and execution with a smooth user
                    experience.
                  </li>
                  <li>
                    <span className="font-medium">Messy Virgo DAO:</span> A Swiss
                    association structure gives the Messy Virgo DAO a kind of
                    Swiss &quot;passport&quot;—recognized governance, clearer compliance
                    paths, and easier partnerships.
                  </li>
                </ul>
              </section>

              <div className="pt-4 flex flex-wrap gap-4 text-sm">
                <a
                  href="https://www.messyvirgo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[rgb(255,105,180)] hover:text-[rgb(255,105,180)]/80 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Homepage</span>
                </a>
                <a
                  href="https://x.com/messyvirgo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[rgb(255,105,180)] hover:text-[rgb(255,105,180)]/80 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter / X</span>
                </a>
                <a
                  href="https://t.me/messyvirgo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[rgb(255,105,180)] hover:text-[rgb(255,105,180)]/80 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
