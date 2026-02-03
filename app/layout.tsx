import type { Metadata } from "next";
import { Inter, Source_Code_Pro, Playfair_Display } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { OnboardingGate } from "./components/OnboardingGate";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID || "6957f29c4d3a403912ed8a58";

  // Web / SEO title (can be longer than the MiniApp name)
  const titleLong = "Crypto Macro & Liquidity Daily (by Messy Virgo)";
  const titleShort = "Crypto Macro Daily — Messy Virgo";
  
  // Debug logging (visible in server console)
  if (process.env.NODE_ENV === "development") {
    console.log("[Base Build Debug] App ID:", baseAppId);
  }
  
  return {
    metadataBase: new URL(minikitConfig.miniapp.homeUrl),
    title: {
      default: titleLong,
      template: `%s | ${titleShort}`,
    },
    description: minikitConfig.miniapp.description,
    applicationName: titleShort,
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon" },
        { url: "/favicons/favicon.svg", type: "image/svg+xml" },
        { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    openGraph: {
      type: "website",
      url: "/",
      title: titleLong,
      description: minikitConfig.miniapp.description,
      siteName: titleShort,
      images: [
        {
          url: minikitConfig.miniapp.ogImageUrl,
          alt: minikitConfig.miniapp.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleLong,
      description: minikitConfig.miniapp.description,
      images: [minikitConfig.miniapp.ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "base:app_id": baseAppId,
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Get your ${minikitConfig.miniapp.name}`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} ${playfairDisplay.variable}`}
      >
        <RootProvider>
          <ThemeProvider>
            <SafeArea>
              <OnboardingGate>{children}</OnboardingGate>
            </SafeArea>
          </ThemeProvider>
        </RootProvider>
      </body>
    </html>
  );
}
