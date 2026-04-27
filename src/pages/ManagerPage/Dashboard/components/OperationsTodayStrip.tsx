import StatCard from "@/components/common/StatCard";
import type { ManagerOperationsToday } from "../_mocks/managerDashboard.mock";
import { ClipboardList, Milestone, NotebookPen, Percent } from "lucide-react";

interface OperationsTodayStripProps {
  data: ManagerOperationsToday;
}

function OperationsTodayStrip({ data }: OperationsTodayStripProps) {
  const complianceTone =
    data.compliancePct >= 80
      ? "success"
      : data.compliancePct >= 50
        ? "warning"
        : "danger";
  const missing = Math.max(0, data.tasksOpen - data.logsSubmitted);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Tỉ lệ ghi nhật ký"
        value={`${data.compliancePct}%`}
        hint={`${data.logsSubmitted}/${data.tasksOpen} công việc`}
        icon={Percent}
        tone={complianceTone}
      />
      <StatCard
        label="Nhật ký hôm nay"
        value={data.logsSubmitted}
        hint="Tổng từ các khu vực bạn quản lý"
        icon={NotebookPen}
        tone="default"
      />
      <StatCard
        label="Công việc chờ ghi"
        value={missing}
        hint={
          missing > 0 ? "Cần nhắc nông dân ghi nhật ký" : "Đã đủ nhật ký hôm nay"
        }
        icon={ClipboardList}
        tone={missing > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Cột mốc đang chạy"
        value={data.milestonesInProgress}
        hint="Trạng thái in_progress"
        icon={Milestone}
        tone="default"
      />
    </div>
  );
}

export default OperationsTodayStrip;
