"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useHasStoredProfile } from "../lib/profile";
import { ProfileChooserModal } from "./ProfileChooserModal";

export function ProfileOnboardingGate() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const hasStoredProfile = useHasStoredProfile(address);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid SSR/hydration flash: don't decide until we're mounted in the browser.
  if (!mounted) return null;

  const shouldShow = !hasStoredProfile && pathname !== "/settings/profile";

  return <ProfileChooserModal isOpen={shouldShow} locked />;
}
