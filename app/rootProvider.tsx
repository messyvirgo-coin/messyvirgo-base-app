"use client";
import { ReactNode, useEffect, useState } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { MiniKitAutoReady } from "./components/MiniKitAutoReady";

export function RootProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only check for API key in the browser, not during build
  if (isMounted && !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-foreground">
          <div className="font-semibold mb-2">Missing configuration</div>
          <div className="text-muted-foreground">
            Set{" "}
            <code className="font-mono">NEXT_PUBLIC_ONCHAINKIT_API_KEY</code> to
            run this app.
          </div>
        </div>
      </div>
    );
  }

  // During build, if API key is missing, use empty string to allow build to proceed
  // At runtime, if API key is missing, the error UI above will be shown
  return (
    <OnchainKitProvider
      apiKey={apiKey || ""}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
        },
        wallet: {
          display: "modal",
          preference: "all",
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: undefined,
      }}
    >
      <MiniKitAutoReady />
      {children}
    </OnchainKitProvider>
  );
}
