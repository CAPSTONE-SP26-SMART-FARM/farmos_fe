import StatCard from "@/components/common/StatCard";
import { formatCurrencyVnd } from "@/lib/format";
import type { AdminKpiSummary } from "@/types/dashboard";
import {
  CreditCard,
  HandCoins,
  Stethoscope,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

interface KpiStripProps {
  data: AdminKpiSummary;
}

/** Period-over-period delta phrase. Renders nothing when delta is exactly 0. */
function deltaHint(delta: number, formatter: (n: number) => string): string | undefined {
  if (delta === 0) return "Không đổi so với kỳ trước";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatter(Math.abs(delta))} so với kỳ trước`;
}

const formatInt = (n: number): string => n.toLocaleString("vi-VN");

function KpiStrip({ data }: KpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Tổng người dùng"
        value={formatInt(data.totalUsers)}
        hint={deltaHint(data.totalUsersDelta, formatInt)}
        icon={Users}
      />
      <StatCard
        label="Tổng doanh thu"
        value={formatCurrencyVnd(data.totalRevenueVnd)}
        hint={deltaHint(data.totalRevenueVndDelta, formatCurrencyVnd)}
        icon={TrendingUp}
        tone={data.totalRevenueVndDelta >= 0 ? "success" : "warning"}
      />
      <StatCard
        label="Tổng gói đã đăng ký"
        value={formatInt(data.totalSubscriptionsRegistered)}
        hint={deltaHint(data.totalSubscriptionsRegisteredDelta, formatInt)}
        icon={CreditCard}
      />
      <StatCard
        label="Tổng số ticket ghi nhận"
        value={formatInt(data.totalTicketsRecorded)}
        hint={deltaHint(data.totalTicketsRecordedDelta, formatInt)}
        icon={Ticket}
      />
      <StatCard
        label="Hồ sơ bác sĩ chờ duyệt"
        value={formatInt(data.pendingDoctorApps)}
        hint={
          data.pendingDoctorApps > 0
            ? deltaHint(data.pendingDoctorAppsDelta, formatInt) ?? "Cần xử lý hôm nay"
            : "Không có hồ sơ nào"
        }
        icon={Stethoscope}
        tone={data.pendingDoctorApps > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Tổng chi phí chi trả bác sĩ"
        value={formatCurrencyVnd(data.doctorPayoutVnd)}
        hint={deltaHint(data.doctorPayoutVndDelta, formatCurrencyVnd)}
        icon={HandCoins}
      />
    </div>
  );
}

export default KpiStrip;
