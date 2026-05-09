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

const formatInt = (n: number): string => n.toLocaleString("vi-VN");

function KpiStrip({ data }: KpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Tổng người dùng"
        value={formatInt(data.totalUsers)}
        icon={Users}
      />
      <StatCard
        label="Tổng doanh thu"
        value={formatCurrencyVnd(data.totalRevenueVnd)}
        icon={TrendingUp}
        tone={data.totalRevenueVndDelta >= 0 ? "success" : "warning"}
      />
      <StatCard
        label="Tổng gói đã đăng ký"
        value={formatInt(data.totalSubscriptionsRegistered)}
        icon={CreditCard}
      />
      <StatCard
        label="Tổng số ticket ghi nhận"
        value={formatInt(data.totalTicketsRecorded)}
        icon={Ticket}
      />
      <StatCard
        label="Hồ sơ bác sĩ chờ duyệt"
        value={formatInt(data.pendingDoctorApps)}
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
        icon={HandCoins}
      />
    </div>
  );
}

export default KpiStrip;
