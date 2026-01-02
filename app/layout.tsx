import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID || "6957f29c4d3a403912ed8a58";
  
  // Debug logging (visible in server console)
  if (process.env.NODE_ENV === "development") {
    console.log("[Base Build Debug] App ID:", baseAppId);
  }
  
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    icons: {
      icon: [
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.ico", sizes: "32x32", type: "image/x-icon" },
      ],
      apple: [
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
      ],
    },
    other: {
      "base:app_id": baseAppId,
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
