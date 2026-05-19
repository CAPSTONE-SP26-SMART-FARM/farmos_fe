import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, ClipboardList, Cpu } from "lucide-react";
import { useOwnerIotConfig } from "@/queries/useProductionMilestone";
import { MilestoneIotConfigSummary } from "@/pages/ManagerPage/CropSeasons/components/MilestoneIotConfigSummary";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";
import {
  MILESTONE_STATUS_META,
  formatDate,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Owner-side variant of MilestoneDetailPane.
 * - Uses useOwnerMilestoneAssignment instead of manager's hook.
 * - Uses OwnerMilestoneTasksSection (read-only, canEdit=false).
 * - No "Cấu hình" wizard button (owner has no FE plumbing for milestone CRUD).
 * - Falls back to list-row data for milestone fields (no useOwnerGetMilestoneDetail
 *   hook exists; the list row already carries the fields we render).
 */

function IotConfigTab({
  cropSeasonId,
  milestoneId,
}: {
  cropSeasonId: string;
  milestoneId: string;
}) {
  const cfgQuery = useOwnerIotConfig(cropSeasonId, milestoneId, true);
  const config = cfgQuery.data?.data;
  return (
    <MilestoneIotConfigSummary
      config={config}
      isLoading={cfgQuery.isLoading}
    />
  );
}

function MilestoneInfoTab({
  milestone,
}: {
  milestone: ProductionMilestoneResType;
}) {
  return (
    <dl className="space-y-1.5 pt-1 text-sm">
      {(milestone.expectedStartDate || milestone.expectedEndDate) && (
        <div className="flex items-baseline gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
          <dt className="text-muted-foreground">Kế hoạch:</dt>
          <dd>
            {formatDate(milestone.expectedStartDate)} →{" "}
            {formatDate(milestone.expectedEndDate)}
          </dd>
        </div>
      )}
      {(milestone.actualStartDate || milestone.actualEndDate) && (
        <div className="flex items-baseline gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground opacity-60" />
          <dt className="text-muted-foreground">Thực tế:</dt>
          <dd>
            {formatDate(milestone.actualStartDate)} →{" "}
            {formatDate(milestone.actualEndDate)}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function OwnerMilestoneDetailPane({
  milestone,
  isWizardState,
}: {
  milestone: ProductionMilestoneResType;
  isWizardState: boolean;
}) {
  const meta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  return (
    <div className="space-y-3 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">
            #{milestone.milestoneOrder}
          </span>
          <h3 className="font-semibold text-base">{milestone.stageName}</h3>
          <Badge variant={meta.variant} className="text-xs">
            {meta.label}
          </Badge>
        </div>
      </div>

      <MilestoneInfoTab milestone={milestone} />

      <Separator />

      {!isWizardState ? (
        <Tabs defaultValue="tasks">
          <TabsList className="h-8">
            <TabsTrigger
              value="tasks"
              className="text-xs h-7 flex items-center gap-1.5"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Nhiệm vụ
            </TabsTrigger>
            <TabsTrigger
              value="iot"
              className="text-xs h-7 flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5" />
              Cấu hình IoT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-3">
            <OwnerMilestoneTasksSection
              milestoneId={milestone.id}
              canEdit={false}
            />
          </TabsContent>

          <TabsContent value="iot" className="mt-3">
            <IotConfigTab cropSeasonId={milestone.cropSeasonId ?? ""} milestoneId={milestone.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            IoT &amp; Cảm biến
          </h4>
          <IotConfigTab cropSeasonId={milestone.cropSeasonId ?? ""} milestoneId={milestone.id} />
        </section>
      )}
    </div>
  );
}
