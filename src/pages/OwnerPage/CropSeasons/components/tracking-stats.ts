// src/pages/OwnerPage/CropSeasons/components/tracking-stats.ts
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

export interface TrackingStats {
  onTime: number;
  late: number;
  early: number;
  unplanned: number;
  totalChanges: number;
  total: number;
  onTimePct: number;
  latePct: number;
  earlyPct: number;
}

export function computeTrackingStats(diff: TrackingDiffResType): TrackingStats {
  let onTime = 0;
  let late = 0;
  let early = 0;
  let totalChanges = 0;

  for (const section of diff.tracked) {
    for (const entity of section.entities) {
      for (const field of entity.fields) {
        totalChanges += field.changeCount;
        const dir = field.variance?.direction;
        if (dir === "on-time" || dir === "equal") onTime++;
        else if (dir === "late" || dir === "higher") late++;
        else if (dir === "early" || dir === "lower") early++;
      }
    }
  }

  let unplanned = 0;
  for (const section of diff.unplanned) {
    unplanned += section.entities.length;
  }

  const total = onTime + late + early;
  const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const latePct = total > 0 ? Math.round((late / total) * 100) : 0;
  const earlyPct = total > 0 ? Math.max(0, 100 - onTimePct - latePct) : 0;

  return {
    onTime,
    late,
    early,
    unplanned,
    totalChanges,
    total,
    onTimePct,
    latePct,
    earlyPct,
  };
}

export function healthTone(
  pct: number,
  hasData: boolean,
): "success" | "warning" | "danger" | "muted" {
  if (!hasData) return "muted";
  if (pct >= 80) return "success";
  if (pct >= 50) return "warning";
  return "danger";
}
