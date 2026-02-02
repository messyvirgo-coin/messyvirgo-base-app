"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { ErrorDisplay } from "@/app/components/ErrorDisplay";
import { MacroReportRenderer } from "@/app/components/macro/MacroReportRenderer";
import { ProfileOnboardingGate } from "@/app/components/ProfileOnboardingGate";
import {
  PROFILE_DEFINITIONS,
  clearStoredProfileId,
  profileById,
  setStoredProfileId,
  useHasStoredProfile,
  useProfileId,
  type ProfileId,
} from "@/app/lib/profile";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";

type MacroStatus = "idle" | "loading" | "success" | "error";

function isProfileId(value: string | null): value is ProfileId {
  return value === "degen" || value === "trader" || value === "allocator";
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-4xl">
      <div
        className="mv-card !rounded-lg border border-input bg-black/40 backdrop-blur-sm overflow-hidden p-6 sm:p-8 text-center text-muted-foreground"
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

  const handleProfileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (!isProfileId(selected)) {
      clearStoredProfileId(fid);
      return;
    }

    setStoredProfileId(selected, fid);
  };

  const reportVariantCode = useMemo(
    () => `${profileId}_daily`,
    [profileId]
  );

  return (
    <PageShell mainClassName="gap-8">
      <ProfileOnboardingGate />
      <PageHeader
        title="Dashboard"
        subtitle="Your daily macro briefing, personalized to your profile."
      />

      <div className="w-full max-w-4xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {hasStoredProfile ? (
              <>
                Profile:{" "}
                <span className="text-foreground">{profile.shortLabel}</span>
              </>
            ) : (
              <>Profile: Select a profile</>
            )}
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background/50 px-3 text-sm text-foreground shadow-sm"
            value={hasStoredProfile ? profileId : ""}
            onChange={handleProfileChange}
            disabled={macroStatus === "loading"}
          >
            <option value="">Select a profile</option>
            {PROFILE_DEFINITIONS.map((profileOption) => (
              <option key={profileOption.id} value={profileOption.id}>
                {profileOption.shortLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {macroStatus === "idle" && (
        <StatusMessage>
          Choose a profile to personalize your Macro report.
        </StatusMessage>
      )}

      {macroStatus === "loading" && (
        <StatusMessage>Loading report...</StatusMessage>
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
