"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  useProfileId,
  setStoredProfileId,
  type ProfileId,
  profileById,
} from "../lib/profile";
import { ProfileChooser } from "./ProfileChooser";
import styles from "./profile.module.css";

interface ProfileChooserModalProps {
  isOpen: boolean;
  onClose?: () => void;
  locked?: boolean;
}

export function ProfileChooserModal({
  isOpen,
  onClose,
  locked = false,
}: ProfileChooserModalProps) {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const currentProfileId = useProfileId(fid);
  const [draftProfileId, setDraftProfileId] =
    useState<ProfileId>(currentProfileId);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const isSmallScreen =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches;
    if (isOpen && !isSmallScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    setDraftProfileId(currentProfileId);
  }, [currentProfileId, isOpen]);

  const handleChoose = () => {
    setStoredProfileId(draftProfileId, fid);
    onClose?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (locked) return;
    if (event.key === "Escape" && onClose) {
      onClose();
    }
  };

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={styles.modalBackdrop}
        onClick={locked ? undefined : onClose ? onClose : undefined}
        role="presentation"
      />
      <div className={styles.modalWrapper} role="presentation">
        <div
          className={styles.modalCard}
          role="dialog"
          aria-modal="true"
          aria-label="Choose your profile"
          onKeyDown={handleKeyDown}
        >
          {!locked && onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          )}

          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Welcome to $MESSY</h2>
            <p className={styles.modalSubtitle}>
              Select your profile to personalize your experience.
            </p>
          </div>

          <ProfileChooser
            selectedProfileId={draftProfileId}
            onSelectProfile={setDraftProfileId}
          />

          <div className={styles.modalFooter}>
            <button type="button" className={styles.primaryButton} onClick={handleChoose}>
              Choose {profileById(draftProfileId).shortLabel}
            </button>
            <div className={styles.secondaryText}>
              You can change this anytime in settings.
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
