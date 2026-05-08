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

interface KpiStripProps {
  data: AdminKpiSummaryV2;
}

function KpiStrip({ data }: KpiStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Tổng người dùng"
        value={data.totalUsers.toLocaleString("vi-VN")}
        icon={Users}
      />
      <StatCard
        label="Tổng doanh thu"
        value={formatCurrencyVnd(data.totalRevenueVnd)}
        icon={TrendingUp}
      />
      <StatCard
        label="Tổng gói đã đăng ký"
        value={data.totalSubscriptionsRegistered.toLocaleString("vi-VN")}
        icon={CreditCard}
      />
      <StatCard
        label="Tổng số ticket ghi nhận"
        value={data.totalTicketsRecorded.toLocaleString("vi-VN")}
        icon={Ticket}
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
        icon={HandCoins}
      />
    </div>
  );
}

export default KpiStrip;
