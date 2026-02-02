"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function OckThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    const ockTheme = resolvedTheme === "dark" ? "default-dark" : "default-light";
    html.setAttribute("data-ock-theme", ockTheme);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <OckThemeSync />
      {children}
    </NextThemesProvider>
  );
}
