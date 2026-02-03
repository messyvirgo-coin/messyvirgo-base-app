"use client";

import { useAccount } from "wagmi";
import { PageHeader } from "@/app/components/PageHeader";
import { PageShell } from "@/app/components/PageShell";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  useProfileId,
  setStoredProfileId,
  type ProfileId,
  profileById,
} from "../../lib/profile";
import { ProfileChooser } from "../../components/ProfileChooser";

export default function ProfileSettingsPage() {
  const { address } = useAccount();
  const profileId = useProfileId(address);

  const handleSelectProfile = (id: ProfileId) => {
    setStoredProfileId(id, address);
  };

  const profile = profileById(profileId);

  return (
    <PageShell mainClassName="gap-8">
      <PageHeader
        title="Profile Settings"
        subtitle={
          <>
            Choose how Messy presents reports, variants, and defaults. Current
            profile: <span className="text-foreground">{profile.shortLabel}</span>.
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
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
