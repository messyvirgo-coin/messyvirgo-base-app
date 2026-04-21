import { cn } from "@/app/lib/utils";

export function ScoreRangeBar({
  label,
  value,
  note,
  max = 100,
  className,
}: {
  label?: string;
  value: number | null | undefined;
  note?: string;
  max?: number;
  className?: string;
}) {
  const upper = Math.max(0.000001, max);
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const clamped = Math.max(0, Math.min(upper, v));
  const widthPct = (clamped / upper) * 100;

  const showLabelRow =
    label !== undefined && label !== null && label.trim() !== "";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabelRow && (
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
          <div className="text-sm font-semibold text-foreground whitespace-nowrap">
            {label}
          </div>
          <div className="text-sm text-foreground whitespace-nowrap">
            {note ?? "—"}
          </div>
        </div>
      )}
      {!showLabelRow && note && (
        <div className="text-sm text-foreground whitespace-nowrap text-right">
          {note}
        </div>
      )}

      <div className="relative h-2 rounded-full bg-gray-500 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-pink-400 via-fuchsia-400 to-violet-400"
          style={{ width: `${widthPct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
