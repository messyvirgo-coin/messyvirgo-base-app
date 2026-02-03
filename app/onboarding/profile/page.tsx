"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { PageShell } from "@/app/components/PageShell";
import { PageHeader } from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import { ProfileChooser } from "@/app/components/ProfileChooser";
import {
  profileById,
  setStoredProfileId,
  type ProfileId,
  useProfileId,
} from "@/app/lib/profile";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { address } = useAccount();
  const currentProfileId = useProfileId(address);
  const [draftProfileId, setDraftProfileId] =
    useState<ProfileId>(currentProfileId);

  const handleConfirm = () => {
    setStoredProfileId(draftProfileId, address);
    router.push("/");
  };

  const shortLabel = profileById(draftProfileId).shortLabel;

  return (
    <PageShell showNav={false} mainClassName="gap-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Choose your profile"
          subtitle="This personalizes labels, defaults, and framing. You can change this later."
          variant="compact"
        />

        <Card className="mv-card rounded-lg">
          <CardContent className="pt-9 space-y-6">
            <ProfileChooser
              selectedProfileId={draftProfileId}
              onSelectProfile={setDraftProfileId}
            />

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full sm:w-auto min-w-70 rounded-full px-6 py-3 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Choose {shortLabel}
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

