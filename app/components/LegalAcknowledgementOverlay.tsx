"use client";

import Image from "next/image";
import Link from "next/link";

type LegalAcknowledgementOverlayProps = {
  open: boolean;
  legalChecked: boolean;
  setLegalChecked: (checked: boolean) => void;
  canAcknowledge: boolean;
  acknowledge: () => void;
};

export function LegalAcknowledgementOverlay({
  open,
  legalChecked,
  setLegalChecked,
  canAcknowledge,
  acknowledge,
}: LegalAcknowledgementOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Terms and privacy acknowledgement"
    >
      <div className="absolute inset-0 bg-black/40 mv-backdrop-blur-xl" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border mv-glass-modal-surface mv-backdrop-blur-md shadow-2xl">
        <div className="p-6 sm:p-7 pt-6 sm:pt-7 pb-4 sm:pb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
            <div className="relative w-full shrink-0 overflow-hidden rounded-2xl bg-muted/20 shadow-sm aspect-4/3 sm:aspect-video lg:h-32 lg:w-32 lg:aspect-square">
              <Image
                src="/messy-create-me.png"
                alt="Market Vibe Daily"
                fill
                sizes="(max-width: 1023px) 100vw, 128px"
                style={{ objectFit: "cover", objectPosition: "top center" }}
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="text-4xl font-semibold font-serif text-gradient leading-tight sm:text-3xl md:text-3xl lg:text-4xl">
                Market Vibe Daily
              </div>
              <div className="mt-1 text-sm text-foreground/70">
                by Messy Virgo / $MESSY
              </div>

              <p className="mt-3 text-sm text-foreground/80">
                Welcome to your Daily crypto market intel. Get today&apos;s
                regime and risk context, plus what traders typically do,
                summarized in 2 minutes. Full report included. No advice,
                education only.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7 pt-3 sm:pt-4">
          <div className="mb-3 text-sm font-semibold text-foreground">
            Before we start:
          </div>

          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-4 p-2 -m-2 rounded-md touch-manipulation active:bg-accent/50 transition-colors">
              <input
                type="checkbox"
                className="h-6 w-6 shrink-0 accent-primary touch-none"
                checked={legalChecked}
                onChange={(e) => setLegalChecked(e.target.checked)}
              />
              <span className="text-sm leading-relaxed">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium underline underline-offset-4 hover:opacity-90"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-start">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md bg-linear-to-r from-pink-500 to-fuchsia-500 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:from-pink-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-pink-500 disabled:hover:to-fuchsia-500"
              onClick={acknowledge}
              disabled={!canAcknowledge}
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
