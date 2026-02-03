"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useHasAcceptedLegal } from "@/app/lib/onboarding";
import { useHasStoredProfile } from "@/app/lib/profile";

type Props = { children: React.ReactNode };

function isExemptPath(pathname: string): boolean {
  if (pathname === "/privacy" || pathname === "/terms") return true;
  if (pathname.startsWith("/onboarding")) return true;
  return false;
}

export function OnboardingGate({ children }: Props) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { address } = useAccount();
  const hasAcceptedLegal = useHasAcceptedLegal(address);
  const hasStoredProfile = useHasStoredProfile(address);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetPath = useMemo(() => {
    if (!mounted) return null;
    if (isExemptPath(pathname)) return null;
    if (!hasAcceptedLegal) return "/onboarding";
    if (!hasStoredProfile) return "/onboarding/profile";
    return null;
  }, [hasAcceptedLegal, hasStoredProfile, mounted, pathname]);

  useEffect(() => {
    if (!targetPath) return;
    if (pathname === targetPath) return;
    router.replace(targetPath);
  }, [pathname, router, targetPath]);

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Image
          src="/logo.svg"
          alt="Messy logo"
          width={56}
          height={56}
          priority
          style={{ objectFit: "contain" }}
        />
        <div>Loading...</div>
      </div>
    );
  }

  // If we need to redirect, suppress app content to avoid flashes behind the redirect.
  if (targetPath) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Image
          src="/logo.svg"
          alt="Messy logo"
          width={56}
          height={56}
          priority
          style={{ objectFit: "contain" }}
        />
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

