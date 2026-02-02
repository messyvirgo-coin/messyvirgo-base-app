"use client";

import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";

export default function TermsPage() {
  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="Terms of Service"
        subtitle="Conditions of use for Messy Virgo"
      />

      <div className="w-full max-w-4xl space-y-4">
        <Card className="mv-card rounded-lg!">
          <CardContent className="space-y-4 text-sm text-foreground/90">
            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
              <p>
                By accessing and using Messy Virgo, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">2. Use License</h3>
              <p>
                Permission is granted to temporarily download one copy of the materials
                (information or software) on Messy Virgo for personal, non-commercial transitory viewing only.
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to decompile or reverse engineer any software contained on Messy Virgo</li>
                <li>Transmit or store infringing, obscene, or otherwise objectionable material</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">3. Disclaimer</h3>
              <p>
                The materials on Messy Virgo are provided on an &apos;as is&apos; basis. Messy Virgo makes no
                warranties, expressed or implied, and hereby disclaims and negates all other warranties
                including, without limitation, implied warranties or conditions of merchantability,
                fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
              <p className="font-semibold text-pink-200 mt-2">
                Messy Virgo is not financial advice. For informational purposes only.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">4. Limitations</h3>
              <p>
                In no event shall Messy Virgo or its suppliers be liable for any damages
                (including, without limitation, damages for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use the materials on Messy Virgo.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">5. Accuracy of Materials</h3>
              <p>
                The materials appearing on Messy Virgo could include technical, typographical,
                or photographic errors. Messy Virgo does not warrant that any of the materials
                on our site are accurate, complete, or current.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">6. Modifications</h3>
              <p>
                Messy Virgo may revise these terms of service for our application at any time
                without notice. By using this application, you are agreeing to be bound by the
                then current version of these terms of service.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">7. Governing Law</h3>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction
                in which Messy Virgo operates, and you irrevocably submit to the exclusive jurisdiction
                of the courts located in that location.
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
