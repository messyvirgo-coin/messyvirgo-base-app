"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  useProfileId,
  setStoredProfileId,
  type ProfileId,
  profileById,
} from "../../lib/profile";
import { ProfileChooser } from "../../components/ProfileChooser";

export default function ProfileSettingsPage() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const profileId = useProfileId(fid);

  const handleSelectProfile = (id: ProfileId) => {
    setStoredProfileId(id, fid);
  };

  return (
    <div style={{ padding: "32px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 960 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Profile Settings</h1>
        <p style={{ margin: "0 0 24px", color: "#9aa4c7" }}>
          Choose how Messy presents reports, variants, and defaults.
        </p>

        <div
          style={{
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0b0b12",
          }}
        >
          <ProfileChooser
            selectedProfileId={profileId}
            onSelectProfile={handleSelectProfile}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            color: "#7b86a8",
            fontSize: 12,
          }}
        >
          Current profile: {profileById(profileId).shortLabel}
        </div>
      </div>
    </div>
  );
}
