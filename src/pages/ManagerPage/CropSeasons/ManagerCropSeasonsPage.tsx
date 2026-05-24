import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BarChart3,
  Plus,
  Wheat,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useManagerListCropSeasons } from "@/queries/useCropSeason";
import { useManagerListAssignedZones } from "@/queries/useZone";
import useDebounce from "@/hooks/useDebounce";
import HarvestRecordTab from "@/components/common/HarvestRecord/HarvestRecordTab";
import { ProductionStatusName, type CropSeasonType } from "@/types/cropSeason";
import { CompleteCropSeasonButton } from "./components/CompleteCropSeasonButton";
import { CreateCropSeasonScreen } from "./components/CreateCropSeasonScreen";
import { CropSeasonSummaryCard } from "./components/CropSeasonSummaryCard";
import { SendRequestDialog } from "./components/SendRequestDialog";
import { UpdateCropSeasonDialog } from "./components/UpdateCropSeasonDialog";
import { MilestoneListPanel } from "./components/MilestoneListPanel";
import { RequestsHistoryTab } from "./components/RequestsHistoryTab";
import { HistoryView } from "./components/HistoryView";
import { HistoryMenu, type HistoryMenuValue } from "./components/HistoryMenu";
import { ZoneLanding } from "./components/ZoneLanding";
import { ZoneSwitcherCombobox } from "./components/ZoneSwitcherCombobox";
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
import { STATUS_MAP } from "./components/helpers";

const STATUS_FILTER_ALL = "all" as const;
type StatusFilterValue = typeof STATUS_FILTER_ALL | ActiveCropSeasonStatusType;

function isActiveStatus(value: string): value is ActiveCropSeasonStatusType {
  return (ActiveCropSeasonStatusValues as readonly string[]).includes(value);
}

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

// `?view=` deep-link state. Default = current season view.
type ViewMode = "current" | "history-seasons" | "history-requests";
const VIEW_VALUES: readonly ViewMode[] = [
  "current",
  "history-seasons",
  "history-requests",
] as const;
function isViewMode(v: string): v is ViewMode {
  return (VIEW_VALUES as readonly string[]).includes(v);
}

export default function ManagerCropSeasonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmReplacePlan, setConfirmReplacePlan] = useState(false);
  const [harvestOpen, setHarvestOpen] = useState(false);

  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  // ── URL state: view + history detail seasonId ────────────────────────────
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

  // ── Zone landing filter ──────────────────────────────────────────────────
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

  const [zoneSearch, setZoneSearch] = useState("");
  const debouncedZoneSearch = useDebounce(zoneSearch.trim(), 300);

  const assignedZonesQuery = useManagerListAssignedZones({
    page: 1,
    limit: 100,
    currentCropSeasonStatus:
      statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter,
    search: !zoneId && debouncedZoneSearch ? debouncedZoneSearch : undefined,
  });
  const assignedZones = assignedZonesQuery.data?.data.data ?? [];
  const assignedZonesTotal = assignedZonesQuery.data?.data.meta.totalItems;
  const hasAssignedZones = assignedZones.length > 0;
  const selectedZone = assignedZones.find((z) => z.id === zoneId);
  const selectedZoneName = selectedZone?.name;
  const selectedZoneAreaSqm = selectedZone?.areaSqm ?? null;

  useEffect(() => {
    if (!zoneId) return;
    if (assignedZonesQuery.isLoading || assignedZonesQuery.isFetching) return;
    if (!assignedZonesQuery.data) return;
    if (assignedZones.some((z) => z.id === zoneId)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    setSearchParams(next, { replace: true });
  }, [
    assignedZones,
    assignedZonesQuery.isLoading,
    assignedZonesQuery.isFetching,
    assignedZonesQuery.data,
    searchParams,
    setSearchParams,
    zoneId,
  ]);

  const { data: allData, isLoading: seasonsLoading } =
    useManagerListCropSeasons(zoneId, {
      page: 1,
      limit: 50,
    });
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

  useEffect(() => {
    if (!zoneId && showCreate) setShowCreate(false);
  }, [showCreate, zoneId]);

  if (!zoneId && !assignedZonesQuery.isLoading) {
    const isFiltering = statusFilter !== STATUS_FILTER_ALL;
    return (
      <ZoneLanding
        zones={assignedZones}
        isLoading={assignedZonesQuery.isLoading}
        searchValue={zoneSearch}
        onSearchChange={setZoneSearch}
        totalCount={assignedZonesTotal}
        onSelect={(id) => {
          const next = new URLSearchParams(searchParams);
          next.set("zoneId", id);
          setSearchParams(next);
        }}
        emptyTitle={
          isFiltering
            ? "Không có khu vực phù hợp"
            : "Chưa được phân công khu vực"
        }
        emptyDescription={
          isFiltering
            ? "Không có khu vực nào có mùa vụ ở trạng thái đã chọn. Thử bỏ lọc để xem tất cả."
            : "Liên hệ chủ trang trại để được phân công quản lý khu vực."
        }
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
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (showCreate && zoneId) {
    return (
      <CreateCropSeasonScreen
        zoneId={zoneId}
        zoneName={selectedZoneName}
        zoneAreaSqm={selectedZoneAreaSqm}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  // Quy tắc nút "Tạo mùa vụ":
  //   - Không có vụ hiện tại → tạo trực tiếp
  //   - Vụ đang ở plan/rejected → cảnh báo sẽ thay thế kế hoạch hiện tại
  //   - Vụ đã active/sent/approved → ẩn nút, không cho tạo song song
  const isPlanningState =
    nowSeason?.status === ProductionStatusName.Planning ||
    nowSeason?.status === ProductionStatusName.Rejected;
  const canStartCreateDirect = !nowSeason;
  const requiresReplacePlanConfirm = !!nowSeason && isPlanningState;
  const showCreateButton = canStartCreateDirect || requiresReplacePlanConfirm;

  const handleCreateClick = () => {
    if (requiresReplacePlanConfirm) setConfirmReplacePlan(true);
    else setShowCreate(true);
  };

  // ── Visibility cho footer buttons của summary card ───────────────────────
  const isHarvestableStatus = (status: string) =>
    status === ProductionStatusName.Active ||
    status === ProductionStatusName.Completed;
  const isPlanVsActualVisibleStatus = (status: string) =>
    status !== ProductionStatusName.Planning &&
    status !== ProductionStatusName.Rejected;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Header row ───────────────────────────────────────────────────── */}
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
          {hasAssignedZones && assignedZones.length > 1 && (
            <ZoneSwitcherCombobox
              zones={assignedZones}
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
          {showCreateButton && (
            <Button size="sm" variant="outline" onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tạo mùa vụ
            </Button>
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
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
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Tạo mùa vụ mới để bắt đầu lên kế hoạch
                </p>
                <Button size="sm" onClick={handleCreateClick}>
                  <Plus className="h-3 w-3 mr-1" />
                  Tạo mùa vụ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <CropSeasonSummaryCard
                season={nowSeason}
                footer={
                  <>
                    {nowSeason.status === ProductionStatusName.Active ? (
                      <CompleteCropSeasonButton
                        season={nowSeason}
                        onOpenHarvest={() => setHarvestOpen(true)}
                      />
                    ) : (
                      <UpdateCropSeasonDialog season={nowSeason} />
                    )}
                    {isPlanVsActualVisibleStatus(nowSeason.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/dashboard/manager/crop-seasons/${nowSeason.id}/plan-vs-actual`,
                          )
                        }
                      >
                        <BarChart3 className="h-3 w-3 mr-1.5" />
                        Kế hoạch vs Thực tế
                      </Button>
                    )}
                    {isHarvestableStatus(nowSeason.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHarvestOpen(true)}
                      >
                        <Wheat className="h-3 w-3 mr-1.5" />
                        Thu hoạch
                      </Button>
                    )}
                  </>
                }
                actions={<SendRequestDialog season={nowSeason} />}
              />

              <MilestoneListPanel cropSeason={nowSeason} zoneId={zoneId} />
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
            <HistoryView
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
              footer={null}
            />
            <MilestoneListPanel
              cropSeason={historyDetail}
              zoneId={zoneId}
              readOnly
            />
          </div>
        )}

        {view === "history-requests" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Lịch sử duyệt</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các lần gửi duyệt của vụ mùa hiện tại
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView("current")}
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Quay lại
              </Button>
            </div>
            {nowSeason ? (
              <RequestsHistoryTab
                cropSeasonId={nowSeason.id}
                readOnly={
                  !(
                    nowSeason.status === ProductionStatusName.Planning ||
                    nowSeason.status === ProductionStatusName.Rejected
                  )
                }
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

      {/* ── Harvest dialog (outer) ────────────────────────────────────────
          Form dialog (inner) nằm trong HarvestRecordTab. Radix tự stack
          via portal, ESC + click-outside chỉ đóng dialog top-most. */}
      <Dialog open={harvestOpen} onOpenChange={setHarvestOpen}>
        <DialogContent
          showCloseButton
          className="max-w-6xl! w-[95vw] max-h-[92vh] overflow-y-auto sm:max-w-6xl!"
        >
          <DialogHeader>
            <DialogTitle>
              Thu hoạch · {nowSeason?.cropName ?? "Vụ mùa"}
            </DialogTitle>
          </DialogHeader>
          {nowSeason && (
            <div className="mt-2">
              <HarvestRecordTab cropSeason={nowSeason} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmReplacePlan}
        title="Thay thế kế hoạch hiện tại?"
        description="Vụ mùa đang ở trạng thái lập kế hoạch sẽ bị huỷ và thay bằng vụ mới. Hành động này không thể hoàn tác."
        confirmLabel="Tiếp tục tạo mới"
        cancelLabel="Huỷ"
        variant="destructive"
        onCancel={() => setConfirmReplacePlan(false)}
        onConfirm={() => {
          setConfirmReplacePlan(false);
          setShowCreate(true);
        }}
      />
    </div>
  );
}
