import StatCard from "@/components/common/StatCard";
import type { ManagerZonesGlance } from "@/types/dashboard";
import { Map, Ruler, Sprout, Users } from "lucide-react";

interface ZonesAtGlanceStripProps {
  data: ManagerZonesGlance;
}

function ZonesAtGlanceStrip({ data }: ZonesAtGlanceStripProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Khu vực được giao"
        value={data.assignedZones}
        hint="Đang phụ trách"
        icon={Map}
        tone="default"
      />
      <StatCard
        label="Tổng diện tích"
        value={`${data.totalAreaSqm.toLocaleString("vi-VN")} m²`}
        hint="Tổng diện tích các khu vực"
        icon={Ruler}
        tone="default"
      />
      <StatCard
        label="Mùa vụ đang chạy"
        value={data.activeCropSeasons}
        hint="Trạng thái active"
        icon={Sprout}
        tone={data.activeCropSeasons > 0 ? "success" : "default"}
      />
      <StatCard
        label="Nông dân đang việc"
        value={data.farmersReporting}
        hint="Có task được phân công"
        icon={Users}
        tone="default"
      />
    </div>
  );
}

export default ZonesAtGlanceStrip;
