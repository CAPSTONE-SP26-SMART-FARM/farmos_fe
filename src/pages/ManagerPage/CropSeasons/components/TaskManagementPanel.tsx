import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import ManagerMilestoneTasksSection from "@/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection";
import type { CropSeasonType } from "@/types/cropSeason";
import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";

interface TaskManagementPanelProps {
  cropSeason: CropSeasonType;
  readOnly?: boolean;
}

export function TaskManagementPanel({ cropSeason, readOnly = false }: TaskManagementPanelProps) {
  const milestonesQuery = useManagerListProductionMilestones(cropSeason.id, {
    page: 1,
    limit: 50,
  });
  const milestones = useMemo(
    () =>
      (milestonesQuery.data?.data.data ?? []).sort(
        (a, b) => a.milestoneOrder - b.milestoneOrder,
      ),
    [milestonesQuery.data],
  );

  const inProgressMilestone = useMemo(
    () => milestones.find((m) => m.status === "in_progress"),
    [milestones],
  );

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");

  const activeMilestoneId =
    selectedMilestoneId ||
    inProgressMilestone?.id ||
    milestones[0]?.id ||
    "";

  if (milestonesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center border rounded-md bg-muted/20">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-medium">Chưa có mốc công việc</p>
        <p className="text-xs text-muted-foreground">
          Tạo mốc trong mùa vụ này để bắt đầu giao nhiệm vụ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={activeMilestoneId}
          onValueChange={setSelectedMilestoneId}
        >
          <SelectTrigger className="h-8 text-xs w-64">
            <SelectValue placeholder="Chọn mốc" />
          </SelectTrigger>
          <SelectContent>
            {milestones.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                #{m.milestoneOrder} {m.stageName}
                {m.status === "in_progress" ? " — đang thực hiện" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeMilestoneId && (
        <ManagerMilestoneTasksSection
          milestoneId={activeMilestoneId}
          canEdit={!readOnly}
        />
      )}
    </div>
  );
}
