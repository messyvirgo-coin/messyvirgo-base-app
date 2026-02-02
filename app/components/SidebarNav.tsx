"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  X,
  Twitter,
  MessageCircle,
  Moon,
  Sun,
  Laptop,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn } from "@/app/lib/utils";
import { profileById, useProfileId } from "@/app/lib/profile";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Dashboard" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const SOCIAL_LINKS: Array<{
  href: string;
  label: string;
  icon: typeof Twitter;
  color: string;
}> = [
  {
    href: "https://x.com/messyvirgo",
    label: "Twitter / X",
    icon: Twitter,
    color: "hover:text-sky-400",
  },
  {
    href: "https://t.me/messyvirgo",
    label: "Telegram",
    icon: MessageCircle,
    color: "hover:text-sky-300",
  },
];

const THEME_OPTIONS = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function SidebarNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef<string | null>(null);
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const profileId = useProfileId(fid);
  const profile = profileById(profileId);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const activeTheme = useMemo(() => theme ?? "system", [theme]);
  const isDarkMode = resolvedTheme === "dark";
  const showBack = (pathname || "/") !== "/";

  // Track an in-app "previous route" as a reliable fallback for webviews where
  // history.back() may be unavailable or cleared.
  useEffect(() => {
    if (!pathname) return;
    const prev = pathnameRef.current;
    pathnameRef.current = pathname;

    if (typeof window === "undefined") return;
    if (prev && prev !== pathname) {
      window.sessionStorage.setItem("mv:lastPath", prev);
    }
    window.sessionStorage.setItem("mv:currentPath", pathname);
  }, [pathname]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      // Prefer browser history back (most "app-like" when it works).
      const idx = (window.history.state as { idx?: number } | null)?.idx;
      const canGoBack =
        typeof idx === "number" ? idx > 0 : window.history.length > 1;

      if (canGoBack) {
        router.back();
        return;
      }

      // If history is not reliable (common in embeds), fall back to last in-app route.
      const last = window.sessionStorage.getItem("mv:lastPath");
      if (last && last !== pathname) {
        router.push(last);
        return;
      }
    }

    // Last resort: dashboard.
    router.push("/");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    // Keep the off-canvas drawer inert when closed (a11y + prevents accidental focus).
    const el = drawerRef.current;
    if (el && "inert" in el) {
      // `inert` is not in TypeScript's standard DOM typings everywhere.
      (el as unknown as { inert: boolean }).inert = !isOpen;
    }

    if (isOpen) {
      // Focus the close button when opening.
      requestAnimationFrame(() => closeButtonRef.current?.focus());
      return;
    }

    // Restore focus to the menu button when closing.
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, [isOpen]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed left-4 z-40 inline-flex overflow-hidden rounded-full",
          // Make the floating control more solid in light mode.
          "border border-border bg-card/95 shadow-lg backdrop-blur-md transition-colors dark:bg-card/80",
          "hover:border-pink-400/40"
        )}
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {showBack ? (
          <>
            <button
              type="button"
              onClick={handleBack}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center",
                "text-foreground transition-colors hover:bg-accent/70"
              )}
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="my-2 w-[0.5px] bg-border/30" aria-hidden="true" />
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          ref={menuButtonRef}
          className={cn(
            "inline-flex h-11 items-center gap-2 px-4",
            "text-sm font-medium text-foreground transition-colors hover:bg-accent/70"
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/4 dark:bg-black/12"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-hidden={isOpen ? undefined : "true"}
        aria-label="Navigation drawer"
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-[min(85vw,320px)] overflow-hidden",
          // In light mode keep the drawer more opaque/solid.
          // In dark mode allow subtle translucency + blur.
          "bg-background backdrop-blur-none shadow-2xl dark:bg-background/95 dark:backdrop-blur-xl",
          "border-r border-border",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="relative h-11 w-11 overflow-hidden rounded-md bg-card">
                <Image
                  src="/logo.svg"
                  alt="Messy logo"
                  fill
                  sizes="44px"
                  style={{ objectFit: "contain" }}
                />
              </span>
              <div className="leading-tight">
                <div className="text-base font-semibold text-foreground">
                  Macro Economics
                </div>
                <div className="text-xs text-foreground/60 dark:text-muted-foreground">
                  by $MESSY
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-md",
                "border border-border bg-card text-foreground dark:bg-background/60",
                "transition-colors hover:border-pink-400/40 hover:bg-accent/60"
              )}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-5 pb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground/60 dark:text-muted-foreground">
              Navigation
            </div>
            <div className="space-y-1">
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
                      "flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 dark:bg-pink-500/15"
                        : "text-foreground hover:bg-accent/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                    )}
                    style={
                      isActive && !isDarkMode
                        ? { color: "rgb(0, 0, 0)" }
                        : isActive && isDarkMode
                        ? { color: "rgb(255, 255, 255)" }
                        : undefined
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-6 text-xs font-semibold uppercase tracking-wider text-foreground/60 dark:text-muted-foreground">
              Join the community
            </div>
            <div className="space-y-1">
              {SOCIAL_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium",
                      "text-foreground transition-colors hover:bg-accent/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground",
                      link.color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>

            <div className="pt-6 text-xs font-semibold uppercase tracking-wider text-foreground/60 dark:text-muted-foreground">
              Theme
            </div>
            <div className="grid gap-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = activeTheme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium",
                      "transition-colors",
                      isActive
                        ? "bg-primary/10 dark:bg-pink-500/15"
                        : "text-foreground hover:bg-accent/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                    )}
                    style={
                      isActive && !isDarkMode
                        ? { color: "rgb(0, 0, 0)" }
                        : isActive && isDarkMode
                          ? { color: "rgb(255, 255, 255)" }
                          : undefined
                    }
                    aria-pressed={isActive}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className={cn(
              "border-t border-border",
              "sticky bottom-0 bg-background",
              "dark:bg-background/70 dark:backdrop-blur-xl"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <Link
              href="/me"
              className={cn(
                "flex min-h-11 w-full items-center gap-3 px-5 py-4",
                "text-sm font-medium text-foreground",
                "transition-colors hover:bg-accent/60"
              )}
            >
              <span className="relative h-8 w-8 overflow-hidden rounded-full border border-border">
                <Image
                  src={profile.iconSrc}
                  alt={profile.shortLabel}
                  fill
                  sizes="32px"
                  style={{ objectFit: "cover" }}
                />
              </span>
              <div className="flex flex-1 items-center justify-between gap-3">
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{profile.shortLabel}</span>
                  <span className="text-xs text-foreground/60 dark:text-muted-foreground">
                    Manage your profile
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-foreground/60 dark:text-muted-foreground" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
