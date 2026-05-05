import StatCard from "@/components/common/StatCard";
import type { OwnerOperationsToday as OperationsToday } from "@/types/dashboard";
import { ClipboardList, Milestone, NotebookPen, Percent } from "lucide-react";

interface OperationsTodayStripProps {
  data: OperationsToday;
}

function OperationsTodayStrip({ data }: OperationsTodayStripProps) {
  const complianceTone =
    data.compliancePct >= 80
      ? "success"
      : data.compliancePct >= 50
        ? "warning"
        : "danger";

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
        hint="Đã được nông dân ghi"
        icon={NotebookPen}
        tone="default"
      />
      <StatCard
        label="Công việc đang mở"
        value={data.tasksOpen}
        hint="Cần ghi nhật ký hôm nay"
        icon={ClipboardList}
        tone={data.tasksOpen > 0 ? "warning" : "default"}
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
