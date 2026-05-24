import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useOwnerListZones } from "@/queries/useZone";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useOwnerListCropSeasons } from "@/queries/useCropSeason";
import HarvestRecordTab from "@/components/common/HarvestRecord/HarvestRecordTab";
import { ZoneSwitcherCombobox } from "@/pages/ManagerPage/CropSeasons/components/ZoneSwitcherCombobox";
import { ZoneLanding } from "@/pages/ManagerPage/CropSeasons/components/ZoneLanding";
import { CropSeasonSummaryCard } from "@/pages/ManagerPage/CropSeasons/components/CropSeasonSummaryCard";
import {
  HistoryMenu,
  type HistoryMenuValue,
} from "@/pages/ManagerPage/CropSeasons/components/HistoryMenu";
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
import { OwnerHistoryView } from "./components/OwnerHistoryView";
import { OwnerRequestsHistoryTab } from "./components/OwnerRequestsHistoryTab";
import { OwnerMilestoneListPanel } from "./components/OwnerMilestoneListPanel";

const STATUS_FILTER_ALL = "all" as const;
type StatusFilterValue = typeof STATUS_FILTER_ALL | ActiveCropSeasonStatusType;

function isActiveStatus(value: string): value is ActiveCropSeasonStatusType {
  return (ActiveCropSeasonStatusValues as readonly string[]).includes(value);
}

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

// `?view=` deep-link state. Default = current season view (giống manager).
type ViewMode = "current" | "history-seasons" | "history-requests";
const VIEW_VALUES: readonly ViewMode[] = [
  "current",
  "history-seasons",
  "history-requests",
] as const;
function isViewMode(v: string): v is ViewMode {
  return (VIEW_VALUES as readonly string[]).includes(v);
}

export default function OwnerCropSeasonsPageV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [harvestOpen, setHarvestOpen] = useState(false);

  const zoneId = searchParams.get("zoneId")?.trim() ?? "";
  const openRequestId = searchParams.get("openRequestId")?.trim() || undefined;

  // ── URL state: view + seasonId ──────────────────────────────────────────
  const rawView = searchParams.get("view")?.trim() ?? "";
  const view: ViewMode = isViewMode(rawView) ? rawView : "current";
  const historySeasonId = searchParams.get("seasonId")?.trim() ?? "";

  const setView = (next: ViewMode, opts?: { seasonId?: string | null }) => {
    const params = new URLSearchParams(searchParams);
    if (next === "current") params.delete("view");
    else params.set("view", next);
    if (opts?.seasonId) params.set("seasonId", opts.seasonId);
    else params.delete("seasonId");
    setSearchParams(params, { replace: true });
  };

  // Deep link: nếu có openRequestId → tự vào history-requests view
  useEffect(() => {
    if (openRequestId && view !== "history-requests") {
      const params = new URLSearchParams(searchParams);
      params.set("view", "history-requests");
      params.delete("seasonId");
      setSearchParams(params, { replace: true });
    }
  }, [openRequestId, view, searchParams, setSearchParams]);

  // Legacy deep-link redirect: notifications/emails có thể trỏ URL cũ
  // (?zoneId&zoneName&cropSeasonId&requestId). Strip extras, preserve requestId
  // làm ?openRequestId.
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

  // ── Zone landing filter ─────────────────────────────────────────────────
  const rawStatusFilter = searchParams.get("statusFilter")?.trim() ?? "";
  const statusFilter: StatusFilterValue = isActiveStatus(rawStatusFilter)
    ? rawStatusFilter
    : STATUS_FILTER_ALL;

  const setStatusFilter = (next: StatusFilterValue) => {
    const params = new URLSearchParams(searchParams);
    if (next === STATUS_FILTER_ALL) params.delete("statusFilter");
    else params.set("statusFilter", next);
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

  // Drop stale zoneId nếu không match
  useEffect(() => {
    if (!zoneId || isZonesLoading) return;
    if (zones.some((z) => z.id === zoneId)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    next.delete("view");
    next.delete("seasonId");
    setSearchParams(next, { replace: true });
  }, [zones, isZonesLoading, searchParams, setSearchParams, zoneId]);

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
  const historyDetail: CropSeasonType | null =
    historySeasonId && view === "history-seasons"
      ? (historySeasons.find((s) => s.id === historySeasonId) ?? null)
      : null;

  // ── Zone landing ────────────────────────────────────────────────────────
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
        emptyTitle={
          isFiltering ? "Không có khu vực phù hợp" : "Chưa có khu vực"
        }
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
            <span className="text-xs text-muted-foreground">
              Lọc theo mùa vụ
            </span>
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
                  <SelectItem
                    key={s}
                    value={s}
                  >
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

  const isHarvestableStatus = (status: string) =>
    status === ProductionStatusName.Active ||
    status === ProductionStatusName.Completed;
  const isPlanVsActualVisibleStatus = (status: string) =>
    status !== ProductionStatusName.Planning &&
    status !== ProductionStatusName.Rejected;

  const planVsActualButton = (seasonId: string) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() =>
        navigate(`/dashboard/owner/crop-seasons/${seasonId}/plan-vs-actual`)
      }
    >
      <BarChart3 className="h-3 w-3 mr-1.5" />
      Kế hoạch vs Thực tế
    </Button>
  );

  const harvestViewButton = (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setHarvestOpen(true)}
    >
      <Wheat className="h-3 w-3 mr-1.5" />
      Xem thu hoạch
    </Button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("zoneId");
              next.delete("view");
              next.delete("seasonId");
              setSearchParams(next);
            }}
            aria-label="Quay lại"
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

        <div className="flex items-center gap-2 flex-wrap md:justify-end">
          {hasZones && zones.length > 1 && (
            <ZoneSwitcherCombobox
              zones={zones}
              value={zoneId}
              onValueChange={(value) => {
                const next = new URLSearchParams(searchParams);
                next.set("zoneId", value);
                next.delete("view");
                next.delete("seasonId");
                setSearchParams(next);
              }}
            />
          )}
          <HistoryMenu
            hasCurrentSeason={!!nowSeason}
            onSelect={(v: HistoryMenuValue) => {
              if (v === "seasons") setView("history-seasons");
              else setView("history-requests");
            }}
          />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        {view === "current" &&
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
            <div className="space-y-4">
              {nowSeason.status === ProductionStatusName.Sent && (
                <div className="flex items-start gap-3 rounded-md border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/30">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Có yêu cầu chờ bạn duyệt
                    </p>
                    <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
                      Quản lý đã gửi kế hoạch sản xuất cho vụ mùa này. Mời bạn
                      xem và phê duyệt hoặc từ chối.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => setView("history-requests")}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                    Duyệt yêu cầu
                  </Button>
                </div>
              )}
              <CropSeasonSummaryCard
                season={nowSeason}
                actions={
                  nowSeason.status === ProductionStatusName.Sent ? (
                    <Button
                      size="sm"
                      onClick={() => setView("history-requests")}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                      Duyệt yêu cầu
                    </Button>
                  ) : (
                    <></>
                  )
                }
                footer={
                  <>
                    {isPlanVsActualVisibleStatus(nowSeason.status) &&
                      planVsActualButton(nowSeason.id)}
                    {isHarvestableStatus(nowSeason.status) && harvestViewButton}
                  </>
                }
              />
              <OwnerMilestoneListPanel
                cropSeason={nowSeason}
                zoneId={zoneId}
              />
            </div>
          ))}

        {view === "history-seasons" && !historyDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Lịch sử vụ mùa</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các vụ đã hoàn thành hoặc huỷ ở khu vực này
                </p>
              </div>
              <div className="flex items-center gap-3">
                {historySeasons.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {historySeasons.length} vụ
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setView("current")}
                >
                  <ArrowLeft className="h-3 w-3 mr-1.5" />
                  Quay lại
                </Button>
              </div>
            </div>
            <OwnerHistoryView
              seasons={historySeasons}
              isLoading={seasonsLoading}
              onSelect={(s) =>
                setView("history-seasons", { seasonId: s.id })
              }
            />
          </div>
        )}

        {view === "history-seasons" && historyDetail && (
          <div className="space-y-4">
            <CropSeasonSummaryCard
              season={historyDetail}
              hideSendRequest
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("history-seasons")}
                >
                  <ArrowLeft className="h-3 w-3 mr-1.5" />
                  Quay lại lịch sử
                </Button>
              }
              footer={
                <>
                  {planVsActualButton(historyDetail.id)}
                  {isHarvestableStatus(historyDetail.status) &&
                    harvestViewButton}
                </>
              }
            />
            <OwnerMilestoneListPanel
              cropSeason={historyDetail}
              zoneId={zoneId}
            />
          </div>
        )}

        {view === "history-requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Lịch sử duyệt</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các yêu cầu phê duyệt sản xuất ở khu vực này
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  // Clear openRequestId nếu có khi quay lại
                  const params = new URLSearchParams(searchParams);
                  params.delete("openRequestId");
                  params.delete("view");
                  params.delete("seasonId");
                  setSearchParams(params, { replace: true });
                }}
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Quay lại
              </Button>
            </div>
            {nowSeason ? (
              <OwnerRequestsHistoryTab
                cropSeasonId={nowSeason.id}
                initialRequestId={openRequestId}
              />
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    Chưa có vụ mùa hiện tại để xem lịch sử duyệt.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ── Harvest read-only dialog ──────────────────────────────────────── */}
      <Dialog
        open={harvestOpen}
        onOpenChange={setHarvestOpen}
      >
        <DialogContent
          showCloseButton
          className="max-w-6xl! w-[95vw] max-h-[92vh] overflow-y-auto sm:max-w-6xl!"
        >
          <DialogHeader>
            <DialogTitle>
              Thu hoạch ·{" "}
              {(view === "history-seasons" && historyDetail
                ? historyDetail.cropName
                : nowSeason?.cropName) ?? "Vụ mùa"}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const targetSeason =
              view === "history-seasons" && historyDetail
                ? historyDetail
                : nowSeason;
            return targetSeason ? (
              <div className="mt-2">
                <HarvestRecordTab
                  cropSeason={targetSeason}
                  readOnly
                />
              </div>
            ) : null;
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
