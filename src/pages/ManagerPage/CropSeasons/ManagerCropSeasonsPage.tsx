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
  Plus,
  Radio,
  Send,
  SlidersHorizontal,
  Sprout,
  Wheat,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useManagerListCropSeasons } from "@/queries/useCropSeason";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { ProductionStatusName, type CropSeasonType } from "@/types/cropSeason";
import { CreateCropSeasonScreen } from "./components/CreateCropSeasonScreen";
import { CropSeasonSummaryCard } from "./components/CropSeasonSummaryCard";
import { SendRequestDialog } from "./components/SendRequestDialog";
import { UpdateCropSeasonDialog } from "./components/UpdateCropSeasonDialog";
import { MilestonesWithDetailTab } from "./components/MilestonesWithDetailTab";
import { RequestsHistoryTab } from "./components/RequestsHistoryTab";
import { SensorOverviewTab } from "./components/SensorOverviewTab";
import { IncidentTab } from "./components/IncidentTab";
import TrackingConfigPanel from "./components/TrackingConfigPanel";
import HarvestRecordTab from "@/components/common/HarvestRecord/HarvestRecordTab";
import { DailyLogsTab } from "./components/DailyLogsTab";
import { HistoryView } from "./components/HistoryView";
import { ZoneLanding } from "./components/ZoneLanding";
import { ZoneSwitcherCombobox } from "./components/ZoneSwitcherCombobox";

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

export default function ManagerCropSeasonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"now" | "history">("now");
  const [historyDetail, setHistoryDetail] = useState<CropSeasonType | null>(null);
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const assignedZonesQuery = useManagerListAssignedZones({
    page: 1,
    limit: 100,
  });
  const assignedZones = assignedZonesQuery.data?.data.data ?? [];
  const hasAssignedZones = assignedZones.length > 0;
  const selectedZoneName = assignedZones.find((z) => z.id === zoneId)?.name;

  useEffect(() => {
    if (!zoneId || assignedZonesQuery.isLoading) return;
    if (assignedZones.some((z) => z.id === zoneId)) return;
    const next = new URLSearchParams(searchParams);
    next.delete("zoneId");
    setSearchParams(next, { replace: true });
  }, [
    assignedZones,
    assignedZonesQuery.isLoading,
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

  useEffect(() => {
    if (!zoneId && showCreate) setShowCreate(false);
  }, [showCreate, zoneId]);

  if (!zoneId && !assignedZonesQuery.isLoading) {
    return (
      <ZoneLanding
        zones={assignedZones}
        isLoading={assignedZonesQuery.isLoading}
        onSelect={(id) => {
          const next = new URLSearchParams(searchParams);
          next.set("zoneId", id);
          setSearchParams(next);
        }}
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

  if (showCreate && zoneId) {
    return (
      <CreateCropSeasonScreen
        zoneId={zoneId}
        zoneName={selectedZoneName}
        onBack={() => setShowCreate(false)}
      />
    );
  }

  const isPlanningState =
    nowSeason?.status === ProductionStatusName.Planning ||
    nowSeason?.status === ProductionStatusName.Rejected;

  const tabMotion = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.18, ease: "easeOut" as const },
  };

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

        {hasAssignedZones && assignedZones.length > 1 && (
          <ZoneSwitcherCombobox
            zones={assignedZones}
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
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left hover:bg-accent text-foreground"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Tạo mùa vụ
            </button>
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
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Tạo mùa vụ mới để bắt đầu lên kế hoạch
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tạo mùa vụ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <CropSeasonSummaryCard
                  season={nowSeason}
                  zoneId={zoneId}
                  actions={
                    <>
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
                      <UpdateCropSeasonDialog season={nowSeason} />
                      <SendRequestDialog season={nowSeason} />
                    </>
                  }
                />

                {isPlanningState ? (
                  <Tabs defaultValue="milestones">
                    <TabsList className="w-full md:w-auto">
                      <TabsTrigger
                        value="milestones"
                        className="flex items-center gap-1.5"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Mốc công việc
                      </TabsTrigger>
                      <TabsTrigger
                        value="tracking-config"
                        className="flex items-center gap-1.5"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Cấu hình theo dõi
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
                      <motion.div
                        key="milestones"
                        {...tabMotion}
                      >
                        <MilestonesWithDetailTab
                          cropSeason={nowSeason}
                          zoneId={zoneId}
                        />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="tracking-config"
                      className="mt-4"
                    >
                      <motion.div
                        key="tracking-config"
                        {...tabMotion}
                      >
                        <TrackingConfigPanel
                          cropSeasonId={nowSeason.id}
                          readOnly={false}
                        />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="requests"
                      className="mt-4"
                    >
                      <motion.div
                        key="requests"
                        {...tabMotion}
                      >
                        <RequestsHistoryTab
                          cropSeasonId={nowSeason.id}
                          readOnly={false}
                        />
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <Tabs defaultValue="milestones-op">
                    <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
                      <TabsTrigger
                        value="milestones-op"
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
                        value="tracking-config"
                        className="flex items-center gap-1.5"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Cấu hình theo dõi
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
                      value="milestones-op"
                      className="mt-4"
                    >
                      <motion.div
                        key="milestones-op"
                        {...tabMotion}
                      >
                        <MilestonesWithDetailTab
                          cropSeason={nowSeason}
                          zoneId={zoneId}
                        />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="sensors"
                      className="mt-4"
                    >
                      <motion.div
                        key="sensors"
                        {...tabMotion}
                      >
                        <SensorOverviewTab cropSeason={nowSeason} />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="incidents"
                      className="mt-4"
                    >
                      <motion.div
                        key="incidents"
                        {...tabMotion}
                      >
                        <IncidentTab cropSeason={nowSeason} />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="daily-logs"
                      className="mt-4"
                    >
                      <motion.div
                        key="daily-logs"
                        {...tabMotion}
                      >
                        <DailyLogsTab
                          zoneId={zoneId}
                          zoneName={selectedZoneName}
                          cropSeason={nowSeason}
                        />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="tracking-config"
                      className="mt-4"
                    >
                      <motion.div
                        key="tracking-config-op"
                        {...tabMotion}
                      >
                        {/* BE PUT chỉ cho phép khi cropSeason.status=planning
                          (xem `tracking.controller.ts:54`). Ở state khác →
                          read-only để Manager vẫn xem được cấu hình hiện tại. */}
                        <TrackingConfigPanel
                          cropSeasonId={nowSeason.id}
                          readOnly={true}
                        />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="harvest"
                      className="mt-4"
                    >
                      <motion.div
                        key="harvest"
                        {...tabMotion}
                      >
                        <HarvestRecordTab cropSeason={nowSeason} />
                      </motion.div>
                    </TabsContent>
                    <TabsContent
                      value="requests"
                      className="mt-4"
                    >
                      <motion.div
                        key="requests-op"
                        {...tabMotion}
                      >
                        <RequestsHistoryTab
                          cropSeasonId={nowSeason.id}
                          readOnly={true}
                        />
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
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
              <HistoryView
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
                zoneId={zoneId}
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
              <Tabs defaultValue="milestones-op">
                <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
                  <TabsTrigger
                    value="milestones-op"
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
                    value="tracking-config"
                    className="flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Cấu hình theo dõi
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
                <TabsContent value="milestones-op" className="mt-4">
                  <MilestonesWithDetailTab
                    cropSeason={historyDetail}
                    zoneId={zoneId}
                  />
                </TabsContent>
                <TabsContent value="sensors" className="mt-4">
                  <SensorOverviewTab cropSeason={historyDetail} />
                </TabsContent>
                <TabsContent value="incidents" className="mt-4">
                  <IncidentTab cropSeason={historyDetail} />
                </TabsContent>
                <TabsContent value="daily-logs" className="mt-4">
                  <DailyLogsTab
                    zoneId={zoneId}
                    zoneName={selectedZoneName}
                    cropSeason={historyDetail}
                  />
                </TabsContent>
                <TabsContent value="tracking-config" className="mt-4">
                  <TrackingConfigPanel
                    cropSeasonId={historyDetail.id}
                    readOnly={true}
                  />
                </TabsContent>
                <TabsContent value="harvest" className="mt-4">
                  <HarvestRecordTab cropSeason={historyDetail} />
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                  <RequestsHistoryTab
                    cropSeasonId={historyDetail.id}
                    readOnly={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
