import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  History,
  Layers,
  Radio,
  Send,
  Sprout,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useOwnerListZones } from "@/queries/useZone";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useOwnerListCropSeasons } from "@/queries/useCropSeason";
import { OwnerHistoryView } from "./components/OwnerHistoryView";
import { OwnerMilestonesWithDetailTab } from "./components/OwnerMilestonesWithDetailTab";
import { OwnerRequestsHistoryTab } from "./components/OwnerRequestsHistoryTab";
import { OwnerSensorOverviewTab } from "./components/OwnerSensorOverviewTab";
import { OwnerIncidentTab } from "./components/OwnerIncidentTab";
import { OwnerDailyLogsTab } from "./components/OwnerDailyLogsTab";
import HarvestRecordTab from "@/components/common/HarvestRecord/HarvestRecordTab";
import { ZoneSwitcherCombobox } from "@/pages/ManagerPage/CropSeasons/components/ZoneSwitcherCombobox";
import { ZoneLanding } from "@/pages/ManagerPage/CropSeasons/components/ZoneLanding";
import { CropSeasonSummaryCard } from "@/pages/ManagerPage/CropSeasons/components/CropSeasonSummaryCard";
import { ProductionStatusName, type CropSeasonType } from "@/types/cropSeason";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActiveCropSeasonStatusValues,
  type ActiveCropSeasonStatusType,
} from "@/schemaValidatation/zone";
import { STATUS_MAP } from "@/pages/ManagerPage/CropSeasons/components/helpers";

const STATUS_FILTER_ALL = "all" as const;
type StatusFilterValue = typeof STATUS_FILTER_ALL | ActiveCropSeasonStatusType;

function isActiveStatus(value: string): value is ActiveCropSeasonStatusType {
  return (ActiveCropSeasonStatusValues as readonly string[]).includes(value);
}

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

// Planning-state season → tab strip with Milestones + Requests (with embedded approve/reject).
// When status === "sent" (manager has submitted, owner hasn't replied) OR a deep link
// asks to open a specific request, default-select the requests tab.
function NowSeasonContent({
  season,
  zoneId,
  zoneName,
  openRequestId,
  onRequestOpened,
}: {
  season: import("@/types/cropSeason").CropSeasonType;
  zoneId: string;
  zoneName?: string;
  openRequestId?: string;
  onRequestOpened?: () => void;
}) {
  const navigate = useNavigate();
  const isPlanningState =
    season.status === ProductionStatusName.Planning ||
    season.status === ProductionStatusName.Rejected;
  const isSent = season.status === ProductionStatusName.Sent;

  const defaultTab = openRequestId || isSent ? "requests" : "milestones";

  return (
    <div className="space-y-4">
      <CropSeasonSummaryCard
        season={season}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate(
                `/dashboard/owner/crop-seasons/${season.id}/plan-vs-actual`,
              )
            }
          >
            <BarChart3 className="h-3 w-3 mr-1.5" />
            Kế hoạch vs Thực tế
          </Button>
        }
        footer={null}
      />

      {isPlanningState ? (
        <Tabs
          defaultValue={defaultTab}
          onValueChange={(v) => {
            if (v === "requests") onRequestOpened?.();
          }}
        >
          <TabsList className="w-full md:w-auto">
            <TabsTrigger
              value="milestones"
              className="flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              Mốc công việc
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Yêu cầu phê duyệt
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="milestones"
            className="mt-4"
          >
            <OwnerMilestonesWithDetailTab cropSeason={season} />
          </TabsContent>
          <TabsContent
            value="requests"
            className="mt-4"
          >
            <OwnerRequestsHistoryTab
              cropSeasonId={season.id}
              initialRequestId={openRequestId}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs
          defaultValue={defaultTab}
          onValueChange={(v) => {
            if (v === "requests") onRequestOpened?.();
          }}
        >
          <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
            <TabsTrigger
              value="milestones"
              className="flex items-center gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" />
              Mốc công việc
            </TabsTrigger>
            <TabsTrigger
              value="sensors"
              className="flex items-center gap-1.5"
            >
              <Radio className="h-3.5 w-3.5" />
              Cảm biến
            </TabsTrigger>
            <TabsTrigger
              value="incidents"
              className="flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Sự cố
            </TabsTrigger>
            <TabsTrigger
              value="daily-logs"
              className="flex items-center gap-1.5"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Nhiệm vụ
            </TabsTrigger>
            <TabsTrigger
              value="harvest"
              className="flex items-center gap-1.5"
            >
              <Wheat className="h-3.5 w-3.5" />
              Thu hoạch
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Yêu cầu duyệt
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="milestones"
            className="mt-4"
          >
            <OwnerMilestonesWithDetailTab cropSeason={season} />
          </TabsContent>
          <TabsContent
            value="sensors"
            className="mt-4"
          >
            <OwnerSensorOverviewTab cropSeason={season} />
          </TabsContent>
          <TabsContent
            value="incidents"
            className="mt-4"
          >
            <OwnerIncidentTab cropSeason={season} />
          </TabsContent>
          <TabsContent
            value="daily-logs"
            className="mt-4"
          >
            <OwnerDailyLogsTab
              zoneId={zoneId}
              zoneName={zoneName}
              cropSeason={season}
            />
          </TabsContent>
          <TabsContent
            value="harvest"
            className="mt-4"
          >
            <HarvestRecordTab
              cropSeason={season}
              readOnly={true}
            />
          </TabsContent>
          <TabsContent
            value="requests"
            className="mt-4"
          >
            <OwnerRequestsHistoryTab
              cropSeasonId={season.id}
              initialRequestId={openRequestId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function OwnerCropSeasonsPageV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarTab, setSidebarTab] = useState<"now" | "history">("now");
  const [historyDetail, setHistoryDetail] = useState<CropSeasonType | null>(
    null,
  );
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";
  const openRequestId = searchParams.get("openRequestId")?.trim() || undefined;

  // Legacy deep-link redirect: notifications/emails may reference the old
  // 4-param URL (?zoneId&zoneName&cropSeasonId&requestId). The new page only
  // uses ?zoneId. Strip the extras and preserve requestId as ?openRequestId
  // so the Requests tab can pre-select it.
  useEffect(() => {
    const hasLegacy =
      searchParams.has("zoneName") ||
      searchParams.has("cropSeasonId") ||
      (searchParams.has("requestId") && !searchParams.has("openRequestId"));
    if (!hasLegacy) return;
    const next = new URLSearchParams();
    if (zoneId) next.set("zoneId", zoneId);
    const reqId = searchParams.get("requestId");
    if (reqId) next.set("openRequestId", reqId);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, zoneId]);

  const rawStatusFilter = searchParams.get("statusFilter")?.trim() ?? "";
  const statusFilter: StatusFilterValue = isActiveStatus(rawStatusFilter)
    ? rawStatusFilter
    : STATUS_FILTER_ALL;

  const setStatusFilter = (next: StatusFilterValue) => {
    const params = new URLSearchParams(searchParams);
    if (next === STATUS_FILTER_ALL) {
      params.delete("statusFilter");
    } else {
      params.set("statusFilter", next);
    }
    setSearchParams(params, { replace: true });
  };

  const farmQuery = useOwnerGetMyFarm();
  const farmId = farmQuery.data?.data.id ?? "";
  const zonesQuery = useOwnerListZones(farmId, {
    page: 1,
    limit: 10,
    currentCropSeasonStatus:
      statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
  });
  const zones = useMemo(
    () => zonesQuery.data?.data.data ?? [],
    [zonesQuery.data],
  );
  const isZonesLoading = farmQuery.isLoading || zonesQuery.isLoading;
  const hasZones = zones.length > 0;
  const selectedZoneName = zones.find((z) => z.id === zoneId)?.name;

  // Drop stale zoneId from URL if it doesn't match any zone
  const isZonesFetching = farmQuery.isFetching || zonesQuery.isFetching;
  useEffect(() => {
    if (!zoneId) return;
    if (isZonesLoading || isZonesFetching) return;
    if (!zonesQuery.data) return;
    if (zones.some((z) => z.id === zoneId)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    setSearchParams(next, { replace: true });
  }, [zones, isZonesLoading, isZonesFetching, zonesQuery.data, searchParams, setSearchParams, zoneId]);

  useEffect(() => {
    setHistoryDetail(null);
  }, [zoneId]);

  const { data: allData, isLoading: seasonsLoading } = useOwnerListCropSeasons(
    zoneId,
    { page: 1, limit: 50 },
  );
  const allSeasons = allData?.data.data ?? [];
  const nowSeason =
    allSeasons.find((s) => !HISTORY_STATUSES.has(s.status)) ?? null;
  const historySeasons = allSeasons.filter((s) =>
    HISTORY_STATUSES.has(s.status),
  );

  if (!zoneId && !isZonesLoading) {
    const isFiltering = statusFilter !== STATUS_FILTER_ALL;
    return (
      <ZoneLanding
        zones={zones}
        isLoading={isZonesLoading}
        onSelect={(id) => {
          const next = new URLSearchParams(searchParams);
          next.set("zoneId", id);
          setSearchParams(next);
        }}
        badgeText="Cổng chủ trang trại"
        description="Chọn khu vực để xem mùa vụ và phê duyệt yêu cầu sản xuất."
        emptyTitle={isFiltering ? "Không có khu vực phù hợp" : "Chưa có khu vực"}
        emptyDescription={
          isFiltering
            ? "Không có khu vực nào có mùa vụ ở trạng thái đã chọn. Thử bỏ lọc để xem tất cả."
            : "Hãy tạo khu vực trong mục Quản lý trang trại để bắt đầu."
        }
        actionLabel="Xem mùa vụ"
        showCropSeason
        showZoneTypeBadge={false}
        headerSlot={
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Lọc theo mùa vụ</span>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilterValue)}
            >
              <SelectTrigger className="w-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_FILTER_ALL}>Tất cả</SelectItem>
                {ActiveCropSeasonStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_MAP[s]?.label ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    );
  }

  if (!zoneId) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-36 w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("zoneId");
              setSearchParams(next);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Quản lý mùa vụ</p>
            <h1 className="text-xl font-bold leading-tight">
              {selectedZoneName ?? "Khu vực"}
            </h1>
          </div>
        </div>

        {hasZones && zones.length > 1 && (
          <ZoneSwitcherCombobox
            zones={zones}
            value={zoneId}
            onValueChange={(value) => {
              const next = new URLSearchParams(searchParams);
              next.set("zoneId", value);
              setSearchParams(next);
            }}
          />
        )}
      </div>

      <div className="flex gap-4 min-h-[600px]">
        <div className="w-44 shrink-0">
          <nav className="space-y-1 sticky top-4">
            {(["now", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidebarTab(tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  sidebarTab === tab
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                {tab === "now" ? (
                  <Sprout className="h-4 w-4 shrink-0" />
                ) : (
                  <History className="h-4 w-4 shrink-0" />
                )}
                {tab === "now" ? "Vụ mùa hiện tại" : "Lịch sử"}
              </button>
            ))}
            <Separator className="my-3" />
          </nav>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {sidebarTab === "now" &&
            (seasonsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : !nowSeason ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Wheat className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium">Chưa có vụ mùa hiện tại</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quản lý sẽ tạo vụ mùa khi bắt đầu sản xuất.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <NowSeasonContent
                season={nowSeason}
                zoneId={zoneId}
                zoneName={selectedZoneName}
                openRequestId={openRequestId}
                onRequestOpened={() => {
                  if (openRequestId) {
                    const next = new URLSearchParams(searchParams);
                    next.delete("openRequestId");
                    setSearchParams(next, { replace: true });
                  }
                }}
              />
            ))}

          {sidebarTab === "history" && !historyDetail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Lịch sử vụ mùa</h2>
                {historySeasons.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {historySeasons.length} vụ
                  </span>
                )}
              </div>
              <OwnerHistoryView
                seasons={historySeasons}
                isLoading={seasonsLoading}
                onSelect={(s) => setHistoryDetail(s)}
              />
            </div>
          )}

          {sidebarTab === "history" && historyDetail && (
            <div className="space-y-4">
              <CropSeasonSummaryCard
                season={historyDetail}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryDetail(null)}
                  >
                    <ArrowLeft className="h-3 w-3 mr-1.5" />
                    Quay lại lịch sử
                  </Button>
                }
                footer={null}
              />
              <Tabs defaultValue="milestones">
                <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
                  <TabsTrigger
                    value="milestones"
                    className="flex items-center gap-1.5"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Mốc công việc
                  </TabsTrigger>
                  <TabsTrigger
                    value="incidents"
                    className="flex items-center gap-1.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sự cố
                  </TabsTrigger>
                  <TabsTrigger
                    value="daily-logs"
                    className="flex items-center gap-1.5"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Nhiệm vụ
                  </TabsTrigger>
                  <TabsTrigger
                    value="harvest"
                    className="flex items-center gap-1.5"
                  >
                    <Wheat className="h-3.5 w-3.5" />
                    Thu hoạch
                  </TabsTrigger>
                  <TabsTrigger
                    value="requests"
                    className="flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Yêu cầu duyệt
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="milestones"
                  className="mt-4"
                >
                  <OwnerMilestonesWithDetailTab cropSeason={historyDetail} />
                </TabsContent>
                <TabsContent
                  value="incidents"
                  className="mt-4"
                >
                  <OwnerIncidentTab cropSeason={historyDetail} />
                </TabsContent>
                <TabsContent
                  value="daily-logs"
                  className="mt-4"
                >
                  <OwnerDailyLogsTab
                    zoneId={zoneId}
                    zoneName={selectedZoneName}
                    cropSeason={historyDetail}
                    readOnly={true}
                  />
                </TabsContent>
                <TabsContent
                  value="harvest"
                  className="mt-4"
                >
                  <HarvestRecordTab
                    cropSeason={historyDetail}
                    readOnly={true}
                  />
                </TabsContent>
                <TabsContent
                  value="requests"
                  className="mt-4"
                >
                  <OwnerRequestsHistoryTab cropSeasonId={historyDetail.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
