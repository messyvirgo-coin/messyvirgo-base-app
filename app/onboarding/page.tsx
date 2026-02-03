"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { PageShell } from "@/app/components/PageShell";
import { PageHeader } from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  LegalDocumentModal,
  type LegalDoc,
} from "@/app/components/LegalDocumentModal";
import {
  PRIVACY_VERSION,
  TERMS_VERSION,
  setAcceptedCurrentLegal,
} from "@/app/lib/onboarding";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { address } = useAccount();
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [openDoc, setOpenDoc] = useState<LegalDoc | null>(null);

  const canContinue = acceptPrivacy && acceptTerms;
  const legalVersionLabel = useMemo(
    () => `Terms ${TERMS_VERSION} · Privacy ${PRIVACY_VERSION}`,
    []
  );

  const handleContinue = () => {
    if (!canContinue) return;
    setAcceptedCurrentLegal(address);
    router.push("/onboarding/profile");
  };

  return (
    <PageShell showNav={false} mainClassName="gap-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <LegalDocumentModal
          isOpen={openDoc !== null}
          doc={openDoc ?? "privacy"}
          onClose={() => setOpenDoc(null)}
        />

        <div className="flex justify-center">
          <Image
            src="/messy-hero.png"
            alt="Messy Virgo hero"
            width={720}
            height={405}
            priority
            className="w-full max-w-2xl rounded-2xl border border-border/60"
            style={{ objectFit: "cover" }}
          />
        </div>

        <PageHeader
          title="Welcome to Messy Virgo"
          subtitle={
            <>
              Daily macro regime context, made simple and shareable. Pick a profile
              so the report matches how you invest.
            </>
          }
        />

        <Card className="mv-card rounded-lg">
          <CardContent className="space-y-5 text-sm text-foreground/90 pt-9">
            <div className="space-y-3">
              <div className="font-semibold text-foreground">Before you start</div>
              <div className="text-muted-foreground">
                Please review and accept our Privacy Policy and Terms of Service.
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-pink-500"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => setOpenDoc("privacy")}
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-pink-500"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => setOpenDoc("terms")}
                  >
                    Terms of Service
                  </button>
                  .
                </span>
              </label>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full sm:w-auto min-w-60 rounded-full px-6 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
              </button>
              <div className="text-xs text-muted-foreground">{legalVersionLabel}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

