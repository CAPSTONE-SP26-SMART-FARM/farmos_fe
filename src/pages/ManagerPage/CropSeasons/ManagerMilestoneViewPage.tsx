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
  Pencil,
  Radio,
} from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import { useManagerCropSeasonDetail } from "@/queries/useCropSeason";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import {
  ProductionStatusName,
  type CropSeasonType,
} from "@/types/cropSeason";
import type { ProductionMilestoneResType } from "@/schemaValidatation/productionMilestone";
import { formatDate, MILESTONE_STATUS_META } from "./components/helpers";
import { MilestoneTasksTab } from "./components/MilestoneTasksTab";
import { IncidentTab } from "./components/IncidentTab";
import { MilestoneSensorsPane } from "./components/MilestoneSensorsPane";

const VALID_TABS = ["sensors", "incidents", "tasks"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(v: string): v is TabValue {
  return (VALID_TABS as readonly string[]).includes(v);
}

export default function ManagerMilestoneViewPage() {
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
    ? `/dashboard/manager/crop-seasons?zoneId=${encodeURIComponent(zoneId)}`
    : "/dashboard/manager/crop-seasons";
  const configureUrl = zoneId
    ? `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}/configure?zoneId=${encodeURIComponent(zoneId)}`
    : `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}/configure`;

  // URL về của sensor detail page khi user click cảm biến từ tab này. Tab
  // "sensors" là default nên KHÔNG cần `&tab=sensors` (xem setActiveTab —
  // sensors thì xoá `tab` param).
  const milestoneViewBackUrl = zoneId
    ? `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}?zoneId=${encodeURIComponent(zoneId)}`
    : `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}`;

  // ── Data ─────────────────────────────────────────────────────────────────
  const cropSeasonQuery = useManagerCropSeasonDetail(csId);
  const cropSeason: CropSeasonType | undefined = cropSeasonQuery.data?.data;
  const cropSeasonLabel = cropSeason?.cropName ?? "Mùa vụ";

  const listQuery = useManagerListProductionMilestones(csId, {
    page: 1,
    limit: 100,
  });
  const milestones = listQuery.data?.data.data ?? [];
  const milestone = milestones.find(
    (m: ProductionMilestoneResType) => m.id === msId,
  );

  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}`,
    cropSeason?.cropName,
  );
  useDynamicBreadcrumb(
    `/dashboard/manager/crop-seasons/${csId}/milestones/${msId}`,
    milestone?.stageName,
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (listQuery.isLoading || cropSeasonQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
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
            <p className="text-muted-foreground">Không tìm thấy mốc sản xuất.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = MILESTONE_STATUS_META[milestone.status] ?? {
    label: milestone.status,
    variant: "secondary" as const,
  };

  // Khi season chưa active (planning/sent/approved), task chưa nên đánh dấu
  // hoàn thành — match logic của ManagerMilestoneTasksSection.lockComplete.
  const lockComplete =
    cropSeason?.status !== ProductionStatusName.Active &&
    cropSeason?.status !== ProductionStatusName.Completed;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
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

        {/* Nút "Cấu hình mốc" giữ y chang cũ — luôn hiển thị; route wizard
            (`/configure`) tự redirect về view này nếu season không còn ở
            planning/rejected. */}
        <Button size="sm" variant="outline" asChild>
          <Link to={configureUrl}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Cấu hình mốc
          </Link>
        </Button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="sensors" className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Cảm biến
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Sự cố
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Công việc
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="mt-4">
          <MilestoneSensorsPane
            milestone={milestone}
            zoneId={zoneId || cropSeason?.zoneId || ""}
            isLoading={listQuery.isLoading}
            backUrl={milestoneViewBackUrl}
          />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          {cropSeason ? (
            <IncidentTab cropSeason={cropSeason} />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <MilestoneTasksTab
            milestoneId={msId}
            zoneId={zoneId || cropSeason?.zoneId || ""}
            canEdit={true}
            lockComplete={lockComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
