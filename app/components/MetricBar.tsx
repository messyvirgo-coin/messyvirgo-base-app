"use client";

import styles from "./profile.module.css";

interface MetricBarProps {
  label: string;
  value: number;
  note?: string;
}

export function MetricBar({ label, value, note }: MetricBarProps) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <div className={styles.metricBar}>
        <div
          className={styles.metricFill}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className={styles.metricNote}>{note ?? `${value}%`}</span>
    </div>
  );
}
