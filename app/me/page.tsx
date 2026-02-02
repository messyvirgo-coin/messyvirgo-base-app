"use client";

import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";
import { ProfileChooser } from "@/app/components/ProfileChooser";
import {
  profileById,
  setStoredProfileId,
  useProfileId,
  type ProfileId,
} from "@/app/lib/profile";

export default function MePage() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const profileId = useProfileId(fid);
  const profile = profileById(profileId);

  const handleSelectProfile = (id: ProfileId) => {
    setStoredProfileId(id, fid);
  };

  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="Me"
        subtitle={
          <>
            Your preferences for how Messy presents reports. Current profile:{" "}
            <span className="text-foreground">{profile.shortLabel}</span>.
          </>
        }
      />

      <div className="w-full max-w-4xl space-y-4">
        <Card className="mv-card rounded-lg!">
          <CardContent className="pt-9">
            <ProfileChooser
              selectedProfileId={profileId}
              onSelectProfile={handleSelectProfile}
            />
            <div className="mt-6 text-sm text-muted-foreground">
              Looking for more controls?{" "}
              <Link
                href="/settings/profile"
                className="text-pink-200 underline underline-offset-4 decoration-pink-400/30 hover:decoration-pink-300/60"
              >
                Open profile settings
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

