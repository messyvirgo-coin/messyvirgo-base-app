"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClose, useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn } from "@/app/lib/utils";
import { profileById, useProfileId } from "@/app/lib/profile";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/me", label: "Me" },
];

export function AppTopNav() {
  const pathname = usePathname();
  const close = useClose();
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const profileId = useProfileId(fid);
  const profile = profileById(profileId);

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-md">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <nav className="flex items-center gap-2 sm:gap-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2 py-1 text-sm font-medium transition-colors",
                    isActive
                      ? "text-pink-200"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/settings/profile"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-white/15",
                "bg-white/5 px-2.5 py-1.5 text-sm text-foreground",
                "hover:border-pink-400/40 hover:bg-white/10 transition-colors"
              )}
              aria-label="Open profile settings"
            >
              <span className="relative h-7 w-7 overflow-hidden rounded-full border border-white/15">
                <Image
                  src={profile.iconSrc}
                  alt={profile.shortLabel}
                  fill
                  sizes="28px"
                  style={{ objectFit: "cover" }}
                />
              </span>
              <span className="hidden sm:inline">{profile.shortLabel}</span>
              <span className="sm:hidden">Profile</span>
            </Link>

            <button
              type="button"
              onClick={() => close()}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full",
                "border border-white/15 bg-white/5 text-foreground",
                "hover:border-pink-400/40 hover:bg-white/10 transition-colors"
              )}
              aria-label="Close mini app"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

