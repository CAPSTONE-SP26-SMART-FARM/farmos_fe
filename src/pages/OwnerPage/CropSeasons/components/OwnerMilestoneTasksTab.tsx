import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, ListTodo, NotebookPen } from "lucide-react";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import { OwnerMilestoneTaskKpiStrip } from "./OwnerMilestoneTaskKpiStrip";
import { OwnerTodayMilestoneTasksPanel } from "./OwnerTodayMilestoneTasksPanel";
import { OwnerMilestoneDailyLogsPanel } from "./OwnerMilestoneDailyLogsPanel";

/**
 * Owner-side mirror của `MilestoneTasksTab` (manager). Read-only layout:
 *   - KPI strip ở top.
 *   - 3 sub-tabs: Hôm nay / Quản lý / Nhật ký.
 *
 * Mỗi sub-tab dùng owner endpoint riêng (xem doc trong từng panel):
 *   - Hôm nay  → `GET /daily-log/tasks` (shared owner/manager/farmer)
 *   - Quản lý  → `GET /employee-task/owner/production-milestone/:id`
 *   - Nhật ký  → `GET /daily-log/owner/farm/:farmId` (filter zoneId + milestoneId)
 */
export function OwnerMilestoneTasksTab({
  milestoneId,
  zoneId,
}: {
  milestoneId: string;
  zoneId: string;
}) {
  return (
    <div className="space-y-4">
      <OwnerMilestoneTaskKpiStrip milestoneId={milestoneId} />

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
            <OwnerMilestoneTasksSection
              milestoneId={milestoneId}
              canEdit={false}
            />
          </TabsContent>

          <TabsContent value="today" className="mt-0">
            <OwnerTodayMilestoneTasksPanel milestoneId={milestoneId} />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <OwnerMilestoneDailyLogsPanel
              zoneId={zoneId}
              milestoneId={milestoneId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
