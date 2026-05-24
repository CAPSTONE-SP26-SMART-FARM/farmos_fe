import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, ListTodo, NotebookPen } from "lucide-react";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import { TodayZoneTasksPanel } from "./TodayZoneTasksPanel";
import { MilestoneDailyLogsPanel } from "./MilestoneDailyLogsPanel";
import { MilestoneTaskKpiStrip } from "./MilestoneTaskKpiStrip";

/**
 * Tab "Công việc" trong milestone detail.
 *
 * Layout Phase 1 (UX rework):
 *   - KPI strip ở top — đếm: total / hôm nay / chưa ghi nhận / chưa gán / quá
 *     hạn / đã xong. Manager nhìn 1 nhãn là nắm được tình trạng.
 *   - Sub-tabs thay vì 3 section dọc:
 *       · Quản lý       — CRUD + assign + complete (toàn bộ tasks)
 *       · Hôm nay       — operational view, tasks đang active + log status
 *       · Nhật ký       — full log history theo khoảng ngày
 *
 * Lý do chia tab: cả 3 view xoay quanh entity Task nhưng lens khác nhau
 * (TASK vs TASK-of-today vs LOG). Gộp flat sẽ trùng row & confuse cardinality.
 * Phase 2 sẽ thống nhất task card và đẩy log history vào Sheet detail.
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
    <div className="space-y-4">
      {/* ── KPI overview ─────────────────────────────────────────────── */}
      <MilestoneTaskKpiStrip milestoneId={milestoneId} zoneId={zoneId} />

      {/* ── Sub-tabs (vertical sidebar bên trái + content bên phải) ──── */}
      <Tabs
        defaultValue="today"
        orientation="vertical"
        className="flex flex-col md:flex-row gap-4 md:gap-6"
      >
        <TabsList
          className="
            h-auto bg-transparent p-0 gap-1 shrink-0
            flex flex-row md:flex-col w-full md:w-44
            border-b md:border-b-0 md:border-r md:pr-2 md:pb-0 pb-2
            overflow-x-auto md:overflow-visible
          "
        >
          <TabsTrigger
            value="today"
            className="
              w-full justify-start gap-2 px-3 py-2 text-sm
              data-[state=active]:bg-primary/10 data-[state=active]:text-primary
              data-[state=active]:shadow-none
            "
          >
            <ListTodo className="h-4 w-4" />
            Hôm nay
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="
              w-full justify-start gap-2 px-3 py-2 text-sm
              data-[state=active]:bg-primary/10 data-[state=active]:text-primary
              data-[state=active]:shadow-none
            "
          >
            <ClipboardList className="h-4 w-4" />
            Quản lý
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="
              w-full justify-start gap-2 px-3 py-2 text-sm
              data-[state=active]:bg-primary/10 data-[state=active]:text-primary
              data-[state=active]:shadow-none
            "
          >
            <NotebookPen className="h-4 w-4" />
            Nhật ký
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="manage" className="mt-0">
            <ManagerMilestoneTasksSection
              milestoneId={milestoneId}
              zoneId={zoneId}
              canEdit={canEdit}
              lockComplete={lockComplete}
            />
          </TabsContent>

          <TabsContent value="today" className="mt-0">
            <TodayZoneTasksPanel zoneId={zoneId} milestoneId={milestoneId} />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <MilestoneDailyLogsPanel
              zoneId={zoneId}
              milestoneId={milestoneId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
