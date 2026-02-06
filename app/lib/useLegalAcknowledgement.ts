"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const LEGAL_ACK_STORAGE_KEY = "mv_legal_ack_v1";

export function useLegalAcknowledgement() {
  const [mounted, setMounted] = useState(false);
  const [hasAcknowledgedLegal, setHasAcknowledgedLegal] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = window.localStorage.getItem(LEGAL_ACK_STORAGE_KEY);
      if (stored === "true") {
        setHasAcknowledgedLegal(true);
      }
    } catch {
      // If storage is unavailable/blocked, keep overlay visible.
    }
  }, [mounted]);

  const canAcknowledge = useMemo(() => legalChecked, [legalChecked]);

  const acknowledge = useCallback(() => {
    if (!canAcknowledge) return;
    try {
      window.localStorage.setItem(LEGAL_ACK_STORAGE_KEY, "true");
      setHasAcknowledgedLegal(true);
    } catch {
      // If storage fails, still allow access for this session.
      setHasAcknowledgedLegal(true);
    }
  }, [canAcknowledge]);

  return {
    mounted,
    hasAcknowledgedLegal,
    legalChecked,
    setLegalChecked,
    canAcknowledge,
    acknowledge,
  };
}
