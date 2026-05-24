import { ClipboardList, ListTodo, NotebookPen } from "lucide-react";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { TodayZoneTasksPanel } from "./TodayZoneTasksPanel";
import { MilestoneDailyLogsPanel } from "./MilestoneDailyLogsPanel";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ClipboardList;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b pb-2 mb-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

/**
 * Tab "Công việc" trong milestone detail.
 *
 * 3 section dọc:
 *  1. Quản lý công việc — CRUD task của milestone + nút "Hoàn thành"
 *  2. Công việc theo ngày — daily task của milestone HÔM NAY + trạng thái log
 *  3. Nhật ký công việc — log của farmer trong milestone này (BE filter sẽ ship Phase 2)
 */
export function MilestoneTasksTab({
  milestoneId,
  zoneId,
  canEdit = true,
  lockComplete = false,
}: {
  milestoneId: string;
  zoneId: string;
  canEdit?: boolean;
  /** Khi season ở planning, task chưa nên đánh dấu hoàn thành. */
  lockComplete?: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* ── 1. Quản lý công việc ─────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={ClipboardList}
          title="Quản lý công việc"
          description="Tạo, gán, và đánh dấu hoàn thành các công việc trong mốc này"
        />
        <ManagerMilestoneTasksSection
          milestoneId={milestoneId}
          canEdit={canEdit}
          lockComplete={lockComplete}
        />
      </section>

      {/* ── 2. Công việc theo ngày ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={ListTodo}
          title="Công việc theo ngày"
          description="Các công việc cần thực hiện hôm nay và trạng thái ghi nhận của nông dân"
        />
        <TodayZoneTasksPanel zoneId={zoneId} milestoneId={milestoneId} />
      </section>

      {/* ── 3. Nhật ký công việc ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={NotebookPen}
          title="Nhật ký công việc"
          description="Toàn bộ log của nông dân trong mốc này"
        />
        <MilestoneDailyLogsPanel
          zoneId={zoneId}
          milestoneId={milestoneId}
        />
      </section>
    </div>
  );
}
