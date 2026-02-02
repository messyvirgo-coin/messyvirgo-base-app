"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

export function RootProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-foreground">
          <div className="font-semibold mb-2">Missing configuration</div>
          <div className="text-muted-foreground">
            Set <code className="font-mono">NEXT_PUBLIC_ONCHAINKIT_API_KEY</code>{" "}
            to run this app.
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnchainKitProvider
      apiKey={apiKey}
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
      {children}
    </OnchainKitProvider>
  );
}
