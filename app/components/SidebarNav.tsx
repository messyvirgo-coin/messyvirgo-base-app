"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import {
  Menu,
  X,
  Twitter,
  MessageCircle,
  Moon,
  Sun,
  Laptop,
  Share2,
  Download,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { PublishedMacroReportResponse } from "@/app/lib/report-types";
import { buildMacroShareContent } from "@/app/lib/share";

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
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const isSharingRef = useRef(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const pathname = usePathname();
  const swipeStateRef = useRef<{
    pointerId: number | null;
    pointerType: string | null;
    startX: number;
    startY: number;
    startTime: number;
    lastX: number;
    lastTime: number;
    dragging: boolean;
  }>({
    pointerId: null,
    pointerType: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    dragging: false,
  });
  const dragOffsetXRef = useRef(0);
  const dragRafRef = useRef<number | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { composeCast } = useComposeCast();

  const activeTheme = useMemo(() => theme ?? "system", [theme]);
  const isDarkMode = resolvedTheme === "dark";
  const showShare = (pathname || "/") === "/";
  const showDownload = showShare;

  const loadCachedMacroReport = useCallback((): PublishedMacroReportResponse | null => {
    try {
      const raw = window.localStorage.getItem("mv_macro_latest_cache_v1");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { report?: unknown };
      return (parsed?.report as PublishedMacroReportResponse) ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    // Guard against rapid clicks before React re-renders + disables the button.
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    setIsSharing(true);
    try {
      const appUrl = new URL("/", window.location.origin).toString();
      const cached = loadCachedMacroReport();
      const { reportDate, snippet } = buildMacroShareContent(cached);

      await composeCast({
        text: `📊 Market Vibe Daily - ${reportDate}\n\n${snippet}\n\nPowered by @$MESSY - Messy Virgo Coin`,
        embeds: [appUrl],
      });
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      isSharingRef.current = false;
      setIsSharing(false);
    }
  }, [composeCast, loadCachedMacroReport]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    let downloadUrl: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    let didTriggerDownload = false;
    try {
      const url = new URL("/api/macro/download", window.location.origin);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      downloadUrl = window.URL.createObjectURL(blob);
      anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? "messy-market-vibe-daily.md";
      document.body.appendChild(anchor);

      anchor.click();
      didTriggerDownload = true;
    } catch (error) {
      console.error("Download failed:", error);
      // You could add a toast notification here if desired
    } finally {
      // Ensure DOM + blob URL cleanup even if an error happens mid-flow.
      try {
        anchor?.remove();
      } catch {
        // No-op
      }

      if (downloadUrl) {
        if (didTriggerDownload) {
          // Don't revoke immediately after click—downloads are processed async in many browsers.
          // Use a time-based cleanup so it runs even if programmatic clicks don't invoke handlers
          // in a given embedded browser/webview.
          const urlToRevoke = downloadUrl;
          window.setTimeout(() => {
            window.URL.revokeObjectURL(urlToRevoke);
          }, 10_000);
        } else {
          // If we never triggered the download, revoke immediately to avoid leaking.
          window.URL.revokeObjectURL(downloadUrl);
        }
      }

      setIsDownloading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      setDragOffsetX(0);
      setIsDragging(false);
      dragOffsetXRef.current = 0;
      swipeStateRef.current.pointerId = null;
      swipeStateRef.current.dragging = false;
    }
  }, [isOpen]);

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
      wasOpenRef.current = true;
      return;
    }

    // Restore focus to the menu button only when we *just* closed the drawer.
    // Avoid auto-focusing on initial mount (can cause "weird borders"/outlines).
    if (wasOpenRef.current) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
    wasOpenRef.current = false;
  }, [isOpen]);

  const scheduleDragOffsetUpdate = (nextX: number) => {
    dragOffsetXRef.current = nextX;
    if (dragRafRef.current != null) return;
    dragRafRef.current = window.requestAnimationFrame(() => {
      dragRafRef.current = null;
      setDragOffsetX(dragOffsetXRef.current);
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    // Only enable swipe-to-close for touch/pen to avoid odd desktop interactions.
    if (event.pointerType === "mouse") return;

    const el = drawerRef.current;
    if (!el) return;

    swipeStateRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      lastX: event.clientX,
      lastTime: performance.now(),
      dragging: false,
    };

    setIsDragging(false);
    scheduleDragOffsetUpdate(0);

    try {
      el.setPointerCapture(event.pointerId);
    } catch {
      // No-op: pointer capture can fail in some embedded webviews.
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    const state = swipeStateRef.current;
    if (state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (!state.dragging) {
      // Only start a swipe when movement is clearly horizontal.
      const HORIZONTAL_START_PX = 8;
      if (Math.abs(dx) < HORIZONTAL_START_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
      // Drawer opens from the left, so closing is a swipe LEFT.
      if (dx >= 0) return;

      state.dragging = true;
      setIsDragging(true);
    }

    // Once dragging, follow the finger and prevent scroll-jank.
    if (state.dragging) {
      const width = drawerRef.current?.getBoundingClientRect().width ?? 320;
      const clamped = Math.max(dx, -width);
      event.preventDefault();

      state.lastX = event.clientX;
      state.lastTime = performance.now();
      scheduleDragOffsetUpdate(clamped);
    }
  };

  const finishSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    const state = swipeStateRef.current;
    if (state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const now = performance.now();
    const dt = Math.max(1, now - state.startTime);
    const velocityX = dx / dt; // px/ms (negative is left)
    const width = drawerRef.current?.getBoundingClientRect().width ?? 320;

    const closeByDistance = dx < -width * 0.3;
    const closeByVelocity = velocityX < -0.5 && dx < -30;

    const shouldClose = state.dragging && (closeByDistance || closeByVelocity);

    swipeStateRef.current.pointerId = null;
    swipeStateRef.current.dragging = false;
    setIsDragging(false);
    scheduleDragOffsetUpdate(0);

    if (shouldClose) {
      setIsOpen(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Primary actions"
        className={cn(
          // Bottom "toolbar" pill (best practice for 2–3 actions on mobile).
          "fixed left-1/2 z-40 inline-flex items-center -translate-x-1/2 overflow-hidden rounded-full",
          "max-w-[calc(100vw-2rem)]",
          // Make the floating control more solid in light mode.
          "border border-border mv-glass-menu-surface shadow-lg mv-backdrop-blur-md transition-colors",
          "hover:border-pink-400/40"
        )}
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {showShare ? (
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            className={cn(
              "inline-flex min-h-11 min-w-11 h-11 items-center justify-center gap-2 px-4",
              "text-sm font-medium text-foreground transition-colors hover:bg-accent/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "touch-manipulation",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={isSharing ? "Opening share composer..." : "Share"}
            title={isSharing ? "Opening..." : "Share"}
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          ref={menuButtonRef}
          className={cn(
            "inline-flex min-h-11 min-w-11 h-11 items-center justify-center gap-2 px-4",
            "text-sm font-medium text-foreground transition-colors hover:bg-accent/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "touch-manipulation"
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>

        {showDownload ? (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={cn(
              "inline-flex min-h-11 min-w-11 h-11 items-center justify-center gap-2 px-4",
              "text-sm font-medium text-foreground transition-colors hover:bg-accent/70",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "touch-manipulation",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={isDownloading ? "Downloading report..." : "Download report"}
            title={isDownloading ? "Downloading..." : "Download report"}
          >
            <Download className="h-5 w-5" />
            <span>{isDownloading ? "Downloading..." : "Download"}</span>
          </button>
        ) : null}
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
          // Semi-transparent with blur in both light and dark mode
          "mv-glass-drawer-surface shadow-2xl mv-backdrop-blur-md",
          "border-r border-border",
          "transform ease-out",
          isDragging ? "transition-none" : "transition-transform duration-300",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{
          transform: isOpen ? `translateX(${Math.min(0, dragOffsetX)}px)` : "translateX(-100%)",
          willChange: "transform",
          // Allow vertical scrolling while still letting us detect horizontal swipes.
          touchAction: "pan-y",
          // Force isolation to prevent iOS compositor bugs with fixed+transform.
          isolation: "isolate",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
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
                "transition-colors hover:border-pink-400/40 hover:bg-accent/60",
                "touch-manipulation"
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
            <div
              className={cn(
                "mt-3 rounded-lg border border-border p-1",
                "bg-background/60 dark:bg-background/30"
              )}
              role="radiogroup"
              aria-label="Theme"
            >
              <div className="grid grid-cols-3 gap-1">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = activeTheme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold",
                        "transition-colors touch-manipulation",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive
                          ? "bg-primary/15 text-foreground dark:bg-pink-500/20"
                          : "text-foreground/70 hover:bg-accent/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
                      )}
                      role="radio"
                      aria-checked={isActive}
                      title={option.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
