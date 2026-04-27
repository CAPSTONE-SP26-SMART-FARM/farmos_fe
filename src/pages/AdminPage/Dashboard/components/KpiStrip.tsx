import StatCard from "@/components/common/StatCard";
import { formatCurrencyVnd } from "@/lib/format";
import type { AdminKpiSummary } from "../_mocks/adminDashboard.mock";
import {
  AlertOctagon,
  Building2,
  CreditCard,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

function deltaText(value: number): string {
  if (value === 0) return "Không đổi vs kỳ trước";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("vi-VN")} vs kỳ trước`;
}

function deltaCurrencyText(vnd: number): string {
  if (vnd === 0) return "Không đổi vs kỳ trước";
  const sign = vnd > 0 ? "+" : "−";
  return `${sign}${formatCurrencyVnd(Math.abs(vnd))} vs kỳ trước`;
}

interface KpiStripProps {
  data: AdminKpiSummary;
}

function KpiStrip({ data }: KpiStripProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard
        label="Tổng người dùng"
        value={data.totalUsers.toLocaleString("vi-VN")}
        hint={deltaText(data.totalUsersDelta)}
        icon={Users}
        tone={data.totalUsersDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Tổng nông trại"
        value={data.totalFarms.toLocaleString("vi-VN")}
        hint={deltaText(data.totalFarmsDelta)}
        icon={Building2}
        tone={data.totalFarmsDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Đăng ký đang hoạt động"
        value={data.activeSubscriptions.toLocaleString("vi-VN")}
        hint={deltaText(data.activeSubscriptionsDelta)}
        icon={CreditCard}
        tone="default"
      />
      <StatCard
        label="Doanh thu định kỳ (MRR)"
        value={formatCurrencyVnd(data.mrrVnd)}
        hint={deltaCurrencyText(data.mrrVndDelta)}
        icon={TrendingUp}
        tone={data.mrrVndDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Hồ sơ bác sĩ chờ duyệt"
        value={data.pendingDoctorApps}
        hint={
          data.pendingDoctorApps > 0
            ? "Cần xử lý hôm nay"
            : "Không có hồ sơ nào"
        }
        icon={Stethoscope}
        tone={data.pendingDoctorApps > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Ticket nghiêm trọng đang mở"
        value={data.openCriticalTickets}
        hint={
          data.openCriticalTickets > 0 ? "Cần can thiệp" : "Không có ticket P1"
        }
        icon={AlertOctagon}
        tone={data.openCriticalTickets > 0 ? "danger" : "success"}
      />
    </div>
  );
}

export default KpiStrip;
