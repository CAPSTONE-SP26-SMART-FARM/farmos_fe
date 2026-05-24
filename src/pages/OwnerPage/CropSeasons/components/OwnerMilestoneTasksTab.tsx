import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ListTodo, NotebookPen } from "lucide-react";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import { OwnerMilestoneTaskKpiStrip } from "./OwnerMilestoneTaskKpiStrip";

/**
 * Owner-side mirror of `MilestoneTasksTab` (manager). Read-only layout:
 *   - KPI strip ở top (derive client-side từ owner task list)
 *   - 3 sub-tabs: Hôm nay / Quản lý / Nhật ký
 *
 * "Hôm nay" và "Nhật ký" hiện chỉ là placeholder vì BE chưa expose endpoint
 * tương đương `manager/zone-today` & `manager/daily-logs-by-zone` cho owner.
 * Khi BE bổ sung, swap component vào mà không cần đổi layout.
 */
export function OwnerMilestoneTasksTab({
  milestoneId,
}: {
  milestoneId: string;
}) {
  return (
    <div className="space-y-4">
      <OwnerMilestoneTaskKpiStrip milestoneId={milestoneId} />

      <Tabs
        defaultValue="manage"
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
            <Card>
              <CardContent className="py-16 text-center">
                <ListTodo className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">
                  Theo dõi công việc trong ngày
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Tính năng đang được hoàn thiện cho chủ trang trại. Trong thời
                  gian này, mời xem mục "Quản lý" để theo dõi toàn bộ nhiệm vụ
                  của mốc.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <Card>
              <CardContent className="py-16 text-center">
                <NotebookPen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">Nhật ký hoạt động</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Tính năng đang được hoàn thiện cho chủ trang trại. Trong thời
                  gian này, mời xem nhật ký ở mục "Nhật ký nông trại" cấp trang
                  trại.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
