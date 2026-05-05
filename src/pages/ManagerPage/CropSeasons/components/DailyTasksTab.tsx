import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTodo } from "lucide-react";
import { type CropSeasonType, ProductionStatusName } from "@/types/cropSeason";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";

export function DailyTasksTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const listQuery = useManagerListProductionMilestones(cropSeason.id, { page: 1, limit: 50 });
  const milestones = listQuery.data?.data.data ?? [];
  const inProgressMilestone = milestones.find((m) => m.status === "in_progress");
  const isActive = cropSeason.status === ProductionStatusName.Active;

  if (listQuery.isLoading) return <Skeleton className="h-48 w-full" />;

  if (!inProgressMilestone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
        <ListTodo className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Không có mốc đang thực hiện</p>
        <p className="text-xs text-muted-foreground mt-1">
          Nhật ký task sẽ hiển thị khi có mốc ở trạng thái đang thực hiện
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Mốc đang thực hiện:</span>
        <span className="font-medium">
          #{inProgressMilestone.milestoneOrder} {inProgressMilestone.stageName}
        </span>
        <Badge variant="default" className="text-xs">Đang thực hiện</Badge>
      </div>
      <Separator />
      <ManagerMilestoneTasksSection milestoneId={inProgressMilestone.id} canEdit={isActive} />
    </div>
  );
}
