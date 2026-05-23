import { AlertTriangle, PackageCheck, Truck } from "lucide-react";
import KpiCard from "@/components/common/KpiCard";

interface Props {
  totalDevices: number;
  totalErrorBoards: number;
  totalSwapPendingReturn: number;
}

export function AttentionStatCards({
  totalDevices,
  totalErrorBoards,
  totalSwapPendingReturn,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard
        icon={PackageCheck}
        label="Tổng cần xử lý"
        value={totalDevices}
      />
      <KpiCard
        icon={AlertTriangle}
        label="Đang lỗi"
        value={totalErrorBoards}
        tone="danger"
        hint="Chờ thay thiết bị hoặc gỡ phân bổ"
      />
      <KpiCard
        icon={Truck}
        label="Chờ thu hồi về kho"
        value={totalSwapPendingReturn}
        tone="warning"
        hint="Đã thay tại hiện trường"
      />
    </div>
  );
}
