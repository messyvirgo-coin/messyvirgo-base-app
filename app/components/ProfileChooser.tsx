"use client";

import Image from "next/image";
import {
  PROFILE_DEFINITIONS,
  type ProfileId,
  profileById,
} from "../lib/profile";
import { useRef } from "react";
import { MetricBar } from "./MetricBar";
import styles from "./profile.module.css";

interface ProfileChooserProps {
  selectedProfileId: ProfileId;
  onSelectProfile: (id: ProfileId) => void;
}

export function ProfileChooser({
  selectedProfileId,
  onSelectProfile,
}: ProfileChooserProps) {
  const profile = profileById(selectedProfileId);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentIndex = PROFILE_DEFINITIONS.findIndex(
    (item) => item.id === selectedProfileId
  );
  const prevIndex =
    (currentIndex - 1 + PROFILE_DEFINITIONS.length) %
    PROFILE_DEFINITIONS.length;
  const nextIndex = (currentIndex + 1) % PROFILE_DEFINITIONS.length;

  const handlePrev = () => {
    onSelectProfile(PROFILE_DEFINITIONS[prevIndex].id);
  };

  const handleNext = () => {
    onSelectProfile(PROFILE_DEFINITIONS[nextIndex].id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      handlePrev();
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      handleNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    touchStartRef.current = null;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  return (
    <div
      className={styles.chooser}
      role="presentation"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <div className={styles.iconRow}>
        <button
          type="button"
          onClick={handlePrev}
          className={styles.navButton}
          aria-label="Previous profile"
        >
          &#8592;
        </button>

        {PROFILE_DEFINITIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectProfile(item.id)}
            className={`${styles.iconButton} ${
              selectedProfileId === item.id ? styles.iconButtonSelected : ""
            }`}
            aria-label={`Select ${item.label} profile`}
            aria-pressed={selectedProfileId === item.id}
          >
            <Image
              src={item.iconSrc}
              alt={item.label}
              width={56}
              height={56}
              className={styles.iconImage}
            />
          </button>
        ))}

        <button
          type="button"
          onClick={handleNext}
          className={styles.navButton}
          aria-label="Next profile"
        >
          &#8594;
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.heroImage}>
          <Image
            src={profile.imageSrc}
            alt={profile.label}
            fill
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className={styles.details}>
          <div>
            <h3 className={styles.title}>{profile.label}</h3>
            <p className={styles.description}>{profile.description}</p>
          </div>

          <div className={styles.metricList}>
            {profile.traits.map((trait) => (
              <MetricBar
                key={trait.label}
                label={trait.label}
                value={trait.value}
                note={trait.note}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
