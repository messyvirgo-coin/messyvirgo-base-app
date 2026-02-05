"use client";

import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

/**
 * Ensures the MiniKit "ready" handshake is fired even if the app redirects
 * immediately (e.g. onboarding gate). Without this, Base preview "Ready call"
 * can stay stuck on "not ready".
 */
export function MiniKitAutoReady() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return null;
}
