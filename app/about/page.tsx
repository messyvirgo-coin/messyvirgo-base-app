"use client";

import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { profileById, useProfileId } from "@/app/lib/profile";

export default function AboutPage() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const profileId = useProfileId(fid);
  const profile = profileById(profileId);

  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="About"
        subtitle={
          <>
            Messy Virgo is a lightweight market context mini-app. Your experience
            is personalized to the <span className="text-foreground">{profile.shortLabel}</span>{" "}
            profile.
          </>
        }
      />

      <div className="w-full max-w-4xl space-y-4">
        <Card className="mv-card rounded-lg!">
          <CardHeader className="pb-4!">
            <div className="text-sm font-semibold text-foreground">
              What you’re seeing
            </div>
            <div className="text-sm text-muted-foreground">
              A daily macro regime briefing with clear “risk-on / risk-off”
              framing.
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/90">
            <p>
              The goal is to reduce context-switching: you open the app, pick
              your profile once, and get a concise daily macro read.
            </p>
            <p className="text-muted-foreground">
              Not financial advice. For informational purposes only.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 text-xs">
              <Link
                href="/me"
                className="text-pink-200 underline underline-offset-4 decoration-pink-400/30 hover:decoration-pink-300/60"
              >
                Profile Settings
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/privacy"
                className="text-pink-200 underline underline-offset-4 decoration-pink-400/30 hover:decoration-pink-300/60"
              >
                Privacy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/terms"
                className="text-pink-200 underline underline-offset-4 decoration-pink-400/30 hover:decoration-pink-300/60"
              >
                Terms
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

