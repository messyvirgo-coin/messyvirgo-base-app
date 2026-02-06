"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageTransitionLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Intercept clicks on Next.js Link components to show loading immediately
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[href]");

      if (link && link.getAttribute("href")?.startsWith("/")) {
        // Internal navigation detected - show loading immediately
        setIsLoading(true);
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    // Skip on initial mount
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // Pathname changed - navigation completed, hide loading after a brief delay
    if (prevPathnameRef.current !== pathname) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Hide loading after navigation completes (give time for page to render)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        prevPathnameRef.current = pathname;
      }, 150);

      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }
  }, [pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground/70"
          aria-hidden="true"
        />
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    </div>
  );
}
