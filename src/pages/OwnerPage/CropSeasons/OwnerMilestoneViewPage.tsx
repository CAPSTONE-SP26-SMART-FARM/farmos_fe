import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Radio,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useOwnerCropSeasonDetail } from "@/queries/useCropSeason";
import { useOwnerListProductionMilestones } from "@/queries/useProductionMilestone";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import { ProductionStatusName, type CropSeasonType } from "@/types/cropSeason";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import {
  formatDate,
  MILESTONE_STATUS_META,
} from "@/pages/ManagerPage/CropSeasons/components/helpers";
import { OwnerIncidentTab } from "./components/OwnerIncidentTab";
import { OwnerMilestoneSensorsPane } from "./components/OwnerMilestoneSensorsPane";
import { OwnerMilestoneTasksTab } from "./components/OwnerMilestoneTasksTab";

const VALID_TABS = ["sensors", "incidents", "tasks"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(v: string): v is TabValue {
  return (VALID_TABS as readonly string[]).includes(v);
}

/**
 * Owner-side milestone detail page — read-only.
 * 3 tabs: Cảm biến / Sự cố / Công việc. KHÔNG có nút "Cấu hình mốc".
 * Task tab dùng canEdit=false (owner không CRUD task).
 */
export default function OwnerMilestoneViewPage() {
  const { cropSeasonId, milestoneId } = useParams<{
    cropSeasonId: string;
    milestoneId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const csId = cropSeasonId ?? "";
  const msId = milestoneId ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const rawTab = searchParams.get("tab")?.trim() ?? "";
  const activeTab: TabValue = isTabValue(rawTab) ? rawTab : "sensors";
  const setActiveTab = (next: TabValue) => {
    const params = new URLSearchParams(searchParams);
    if (next === "sensors") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const cropSeasonsUrl = zoneId
    ? `/dashboard/owner/crop-seasons?zoneId=${encodeURIComponent(zoneId)}`
    : "/dashboard/owner/crop-seasons";

  // ── Data ─────────────────────────────────────────────────────────────────
  const cropSeasonQuery = useOwnerCropSeasonDetail(csId);
  const cropSeason: CropSeasonType | undefined = cropSeasonQuery.data?.data;
  const cropSeasonLabel = cropSeason?.cropName ?? "Mùa vụ";

  const listQuery = useOwnerListProductionMilestones(csId, {
    page: 1,
    limit: 100,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const milestone = milestones.find(
    (m: ProductionMilestoneResType) => m.id === msId,
  );

  useDynamicBreadcrumb(
    `/dashboard/owner/crop-seasons/${csId}`,
    cropSeason?.cropName,
  );
  useDynamicBreadcrumb(
    `/dashboard/owner/crop-seasons/${csId}/milestones/${msId}`,
    milestone?.stageName,
  );

  if (listQuery.isLoading || cropSeasonQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(cropSeasonsUrl)}
          className="-ml-2 gap-1 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Không tìm thấy mốc sản xuất.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  // Mốc đã hoàn thành → không còn dữ liệu cảm biến thời gian thực, ẩn hẳn tab
  // "Cảm biến". Nếu URL đang trỏ tab sensors thì fallback về "Công việc".
  const isCompleted = milestone.status === "completed";
  const effectiveTab: TabValue =
    isCompleted && activeTab === "sensors" ? "tasks" : activeTab;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={cropSeasonsUrl}>Quản lý mùa vụ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{cropSeasonLabel}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              #{milestone.milestoneOrder} {milestone.stageName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(cropSeasonsUrl)}
            className="shrink-0"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Chi tiết mốc</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight">
                #{milestone.milestoneOrder} {milestone.stageName}
              </h1>
              <Badge
                variant={statusMeta.variant}
                className={statusMeta.className}
              >
                {statusMeta.label}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              <span>
                Kế hoạch: {formatDate(milestone.expectedStartDate)} –{" "}
                {formatDate(milestone.expectedEndDate)}
              </span>
              {(milestone.actualStartDate || milestone.actualEndDate) && (
                <>
                  <span className="opacity-50">·</span>
                  <span>
                    Thực tế: {formatDate(milestone.actualStartDate)} –{" "}
                    {formatDate(milestone.actualEndDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={effectiveTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="w-full md:w-auto">
          {!isCompleted && (
            <TabsTrigger
              value="sensors"
              className="flex items-center gap-1.5"
            >
              <Radio className="h-3.5 w-3.5" />
              Cảm biến
            </TabsTrigger>
          )}
          <TabsTrigger
            value="incidents"
            className="flex items-center gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Sự cố
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="flex items-center gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Công việc
          </TabsTrigger>
        </TabsList>

        {!isCompleted && (
          <TabsContent
            value="sensors"
            className="mt-4"
          >
            <OwnerMilestoneSensorsPane
              milestone={milestone}
              zoneId={zoneId || cropSeason?.zoneId || ""}
              isLoading={listQuery.isLoading}
              isPlanning={cropSeason?.status === ProductionStatusName.Planning}
            />
          </TabsContent>
        )}

        <TabsContent
          value="incidents"
          className="mt-4"
        >
          {cropSeason ? (
            <OwnerIncidentTab cropSeason={cropSeason} milestoneId={msId} />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </TabsContent>

        <TabsContent
          value="tasks"
          className="mt-4"
        >
          <OwnerMilestoneTasksTab
            milestoneId={msId}
            zoneId={zoneId || cropSeason?.zoneId || ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
