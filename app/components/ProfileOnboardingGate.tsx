"use client";

import { usePathname } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useHasStoredProfile } from "../lib/profile";
import { ProfileChooserModal } from "./ProfileChooserModal";

export function ProfileOnboardingGate() {
  const pathname = usePathname();
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const hasStoredProfile = useHasStoredProfile(fid);
  const shouldShow = !hasStoredProfile && pathname !== "/settings/profile";

  return <ProfileChooserModal isOpen={shouldShow} locked />;
}
