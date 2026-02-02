"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import { ProfileOnboardingGate } from "@/app/components/ProfileOnboardingGate";
import {
  profileById,
  useHasStoredProfile,
  useProfileId,
  type ProfileId,
} from "@/app/lib/profile";
import { getMacroVariantLabel } from "@/app/lib/lenses";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

type MacroStatus = "idle" | "loading" | "success" | "error";

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl">
      <div
        className="mv-card rounded-lg border border-input bg-black/40 backdrop-blur-sm overflow-hidden p-6 sm:p-8 text-center text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [macroStatus, setMacroStatus] = useState<MacroStatus>("idle");
  const [macroError, setMacroError] = useState<Error | null>(null);
  const [macroReport, setMacroReport] =
    useState<PublishedMacroReportResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fid = context?.user?.fid ?? null;
  const profileId = useProfileId(fid);
  const hasStoredProfile = useHasStoredProfile(fid);
  const profile = profileById(profileId);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const fetchMacroReport = useCallback(async (profileValue: ProfileId) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMacroStatus("loading");
    setMacroError(null);
    setMacroReport(null);

    try {
      const url = new URL("/api/macro/latest", window.location.origin);
      url.searchParams.set("profile", profileValue);
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      if (abortRef.current !== controller) {
        return;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const detail =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Unknown error";
        throw new Error(detail);
      }

      const report = (await response.json()) as PublishedMacroReportResponse;
      if (abortRef.current !== controller) {
        return;
      }
      setMacroReport(report);
      setMacroStatus("success");
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }
      if (abortRef.current !== controller) {
        return;
      }
      setMacroError(
        fetchError instanceof Error ? fetchError : new Error("Unknown error")
      );
      setMacroStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!hasStoredProfile) {
      setMacroStatus("idle");
      setMacroError(null);
      setMacroReport(null);
      return;
    }

    void fetchMacroReport(profileId);
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport, hasStoredProfile, profileId]);

  const reportVariantCode = useMemo(
    () => `${profileId}_daily`,
    [profileId]
  );

  const dashboardTitle = useMemo(() => {
    if (!hasStoredProfile) return null;
    const variantLabel = getMacroVariantLabel(reportVariantCode);
    if (variantLabel) return variantLabel;
    if (profile.shortLabel) {
      return `${profile.shortLabel}'s Daily Macros`;
    }
    return "Daily Macros";
  }, [hasStoredProfile, reportVariantCode, profile.shortLabel]);

  return (
    <PageShell mainClassName="gap-8">
      <ProfileOnboardingGate />

      {dashboardTitle && (
        <h1 className="text-5xl font-bold font-serif text-gradient leading-[1.15] text-center -mt-4 md:mt-0">
          {dashboardTitle}
        </h1>
      )}

      {macroStatus === "idle" && (
        <StatusMessage>
          Choose a profile to personalize your Macro report.
        </StatusMessage>
      )}

      {macroStatus === "loading" && (
        <StatusMessage>Crunching macro data...</StatusMessage>
      )}

      {macroStatus === "error" && (
        <div className="w-full max-w-4xl">
          <ErrorDisplay error={macroError} />
        </div>
      )}

      {macroStatus === "success" && macroReport?.outputs && (
        <MacroReportRenderer
          outputs={macroReport.outputs}
          variantCode={reportVariantCode}
          macroProfileShortLabel={profile.shortLabel}
          macroCadence="daily"
          macroCadenceDisabled={true}
        />
      )}

      {macroStatus === "success" && !macroReport?.outputs && (
        <StatusMessage>
          Report loaded, but no outputs were returned.
        </StatusMessage>
      )}
    </PageShell>
  );
}
