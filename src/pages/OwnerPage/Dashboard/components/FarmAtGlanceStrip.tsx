import StatCard from "@/components/common/StatCard";
import type { FarmGlance } from "../_mocks/ownerDashboard.mock";
import { Building2, Map, Sprout, Users } from "lucide-react";

interface FarmAtGlanceStripProps {
  data: FarmGlance;
}

function FarmAtGlanceStrip({ data }: FarmAtGlanceStripProps) {
  const totalHeadcount = data.managers + data.farmers;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Diện tích trang trại"
        value={`${data.totalAreaSqm.toLocaleString("vi-VN")} m²`}
        hint={`Phủ vùng ${data.zoneCoveragePct}%`}
        icon={Building2}
        tone="default"
      />
      <StatCard
        label="Số khu vực"
        value={data.zonesCount}
        hint="Đang hoạt động"
        icon={Map}
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
        label="Đội ngũ nhân sự"
        value={totalHeadcount}
        hint={`${data.managers} quản lý · ${data.farmers} nông dân`}
        icon={Users}
        tone="default"
      />
    </div>
  );
}

export default FarmAtGlanceStrip;
