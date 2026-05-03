// src/pages/OwnerPage/CropSeasons/components/KpiSummaryCards.tsx
import { CheckCircle2, AlertTriangle, Sparkles, Activity } from "lucide-react";
import KpiCard from "@/components/common/KpiCard";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

interface KpiSummaryCardsProps {
  diff: TrackingDiffResType;
}

function computeKpis(diff: TrackingDiffResType) {
  let onTime = 0;
  let late = 0;
  let totalChanges = 0;

  for (const section of diff.tracked) {
    for (const entity of section.entities) {
      for (const field of entity.fields) {
        totalChanges += field.changeCount;
        const dir = field.variance?.direction;
        if (dir === "on-time" || dir === "equal") onTime++;
        else if (dir === "late" || dir === "higher") late++;
      }
    }
  }

  let unplanned = 0;
  for (const section of diff.unplanned) {
    unplanned += section.entities.length;
  }

  return { onTime, late, unplanned, totalChanges };
}

export default function KpiSummaryCards({ diff }: KpiSummaryCardsProps) {
  const { onTime, late, unplanned, totalChanges } = computeKpis(diff);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        icon={CheckCircle2}
        label="Đúng kế hoạch"
        value={onTime}
        tone="success"
        hint="Số trường đúng tiến độ"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Trễ / Vượt"
        value={late}
        tone={late > 0 ? "danger" : "default"}
        hint="Số trường trễ hoặc vượt kế hoạch"
      />
      <KpiCard
        icon={Sparkles}
        label="Phát sinh thêm"
        value={unplanned}
        tone={unplanned > 0 ? "warning" : "default"}
        hint="Số thực thể không có trong kế hoạch ban đầu"
      />
      <KpiCard
        icon={Activity}
        label="Tổng thay đổi"
        value={totalChanges}
        tone="default"
        hint="Tổng số lần thay đổi ghi nhận"
      />
    </div>
  );
}
