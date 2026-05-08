import StatCard from "@/components/common/StatCard";
import { formatCurrencyVnd } from "@/lib/format";
import type { AdminKpiSummaryV2 } from "../_mocks/adminDashboardOverlay";
import {
  CreditCard,
  HandCoins,
  Stethoscope,
  Ticket,
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
  data: AdminKpiSummaryV2;
}

function KpiStrip({ data }: KpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Tổng người dùng"
        value={data.totalUsers.toLocaleString("vi-VN")}
        hint={deltaText(data.totalUsersDelta)}
        icon={Users}
        tone={data.totalUsersDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Tổng doanh thu"
        value={formatCurrencyVnd(data.totalRevenueVnd)}
        hint={deltaCurrencyText(data.totalRevenueVndDelta)}
        icon={TrendingUp}
        tone={data.totalRevenueVndDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Tổng gói đã đăng ký"
        value={data.totalSubscriptionsRegistered.toLocaleString("vi-VN")}
        hint={deltaText(data.totalSubscriptionsRegisteredDelta)}
        icon={CreditCard}
        tone={data.totalSubscriptionsRegisteredDelta > 0 ? "success" : "default"}
      />
      <StatCard
        label="Tổng số ticket ghi nhận"
        value={data.totalTicketsRecorded.toLocaleString("vi-VN")}
        hint={deltaText(data.totalTicketsRecordedDelta)}
        icon={Ticket}
        tone="default"
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
        label="Tổng chi phí chi trả bác sĩ"
        value={formatCurrencyVnd(data.doctorPayoutVnd)}
        hint={deltaCurrencyText(data.doctorPayoutVndDelta)}
        icon={HandCoins}
        tone="default"
      />
    </div>
  );
}

export default KpiStrip;
