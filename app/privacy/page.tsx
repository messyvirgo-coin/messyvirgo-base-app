"use client";

import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";

export default function PrivacyPage() {
  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="Privacy Policy"
        subtitle="How we handle your data and privacy"
      />

      <div className="w-full max-w-4xl space-y-4">
        <Card className="mv-card rounded-lg!">
          <CardContent className="space-y-4 text-sm text-foreground/90">
            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Introduction</h3>
              <p>
                Messy Virgo (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) operates the Messy Virgo mini-app.
                This page informs you of our policies regarding the collection, use, and disclosure
                of personal data when you use our application.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Information Collection and Use</h3>
              <p>
                We collect information for various purposes to provide and improve our service to you.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Farcaster ID: To personalize your experience</li>
                <li>Profile Selection: Your chosen portfolio profile preference</li>
                <li>Usage Analytics: How you interact with the application</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Data Storage</h3>
              <p>
                Your profile preference is stored locally in your browser&apos;s local storage.
                No personal data is stored on our servers without your explicit consent.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Security</h3>
              <p>
                The security of your data is important to us but remember that no method
                of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">Changes to This Privacy Policy</h3>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section className="space-y-2 pt-2">
              <h3 className="font-semibold text-foreground">Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us through
                our community channels on X or Telegram.
              </p>
            </section>

            <div className="pt-4">
              <Link
                href="/"
                className="text-pink-200 underline underline-offset-4 decoration-pink-400/30 hover:decoration-pink-300/60"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
