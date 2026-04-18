import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOwnerCropSeasonDetail,
  useOwnerListRequests,
} from "@/queries/useCropSeason";
import {
  useOwnerListProductionMilestones,
  useOwnerMilestoneAssignment,
} from "@/queries/useProductionMilestone";
import type { ProductionRequestType } from "@/types/cropSeason";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Cpu,
  Eye,
  Layers,
  Milestone,
  MoreVertical,
  Radio,
  Ruler,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import OwnerMilestoneTasksSection from "@/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection";

interface Props {
  cropSeasonId: string;
  zoneName: string;
  onBack: () => void;
  onViewRequest: (requestId: string) => void;
}

const SEASON_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

const MILESTONE_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
};

const SENSOR_TYPE_LABELS: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

function formatThresholdText(sensor: {
  threshold?: {
    optimalMin: number | null;
    optimalMax: number | null;
    source: string;
  };
  unit?: string | null;
}) {
  const t = sensor.threshold;
  if (!t || t.optimalMin == null || t.optimalMax == null) {
    return "Chưa cấu hình ngưỡng";
  }
  const unit = sensor.unit ? ` ${sensor.unit}` : "";
  return `${t.optimalMin} - ${t.optimalMax}${unit} (${t.source})`;
}

function MilestoneIotDetail({ milestoneId }: { milestoneId: string }) {
  const assignmentQuery = useOwnerMilestoneAssignment(milestoneId);
  const assignment = assignmentQuery.data?.data?.data ?? null;
  const sensors = assignment?.sensors ?? [];

  if (assignmentQuery.isLoading) {
    return (
      <div className="px-4 py-3">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Lớp vật lý
        </p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          Thiết bị IoT
        </p>
        {!assignment ? (
          <p className="text-xs text-muted-foreground">Chưa gán thiết bị.</p>
        ) : (
          <div className="rounded-md border p-2.5 bg-background text-sm space-y-0.5">
            <p className="font-medium text-xs">
              {assignment.device.deviceName} ({assignment.device.deviceCode})
            </p>
            <p className="text-muted-foreground text-xs capitalize">
              Loại: {assignment.device.deviceType.replace(/_/g, " ")}
            </p>
            <p className="text-muted-foreground text-xs">
              Thời điểm gán:{" "}
              {assignment.assignedAt
                ? format(new Date(assignment.assignedAt), "dd/MM/yyyy")
                : "—"}
            </p>
            {assignment.device.isDeleted && (
              <p className="text-xs text-destructive">
                Thiết bị đã bị xóa mềm; dữ liệu hiển thị từ lịch sử gán.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
          Lớp giám sát
        </p>
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5" />
          Cảm biến + ngưỡng
        </p>
        {!assignment ? (
          <p className="text-xs text-muted-foreground">
            Cần gán thiết bị trước khi quản lý cảm biến.
          </p>
        ) : sensors.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Chưa liên kết cảm biến.
          </p>
        ) : (
          <div className="space-y-1">
            {sensors.map((s) => (
              <div
                key={s.bindingId}
                className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs bg-background"
              >
                <div>
                  <span className="font-medium">
                    {s.sensorName ||
                      SENSOR_TYPE_LABELS[s.sensorType] ||
                      s.sensorType}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize ml-2"
                  >
                    {s.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {`${s.sensorName || SENSOR_TYPE_LABELS[s.sensorType] || s.sensorType} (Ngưỡng: ${formatThresholdText(s)}) trên ${assignment.device.deviceName}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

const DetailSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 w-full"
          />
        ))}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-12 w-full"
          />
        ))}
      </CardContent>
    </Card>
  </div>
);

export default function CropSeasonDetailPanel({
  cropSeasonId,
  zoneName,
  onBack,
  onViewRequest,
}: Props) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState<
    "pending" | "approved" | "rejected" | ""
  >("");
  const [milestonePage, setMilestonePage] = useState(1);
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState<
    "pending" | "in_progress" | "completed" | ""
  >("");
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(
    null,
  );

  const detailQuery = useOwnerCropSeasonDetail(cropSeasonId);
  const milestonesQuery = useOwnerListProductionMilestones(cropSeasonId, {
    page: milestonePage,
    limit: 8,
    status: milestoneStatusFilter || undefined,
  });
  const requestsQuery = useOwnerListRequests(cropSeasonId, {
    page: requestPage,
    limit: 10,
    status: requestStatusFilter || undefined,
  });

  const season = detailQuery.data?.data;
  const milestones = milestonesQuery.data?.data.data ?? [];
  const milestoneMeta = milestonesQuery.data?.data.meta;
  const requests = requestsQuery.data?.data.data ?? [];
  const requestMeta = requestsQuery.data?.data.meta;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const seasonStatus = season
    ? (SEASON_STATUS_MAP[season.status] ?? {
        label: season.status,
        variant: "secondary" as const,
      })
    : null;
  const seasonName = season?.cropName ?? "Mùa vụ";

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">Khu vực</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground font-medium">
                {zoneName}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">Mùa vụ</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground font-medium">
                {seasonName}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mốc</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách mùa vụ — {zoneName}
        </Button>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Chi tiết mùa vụ</Badge>
            <h1 className="text-2xl font-bold">
              {season ? (
                season.cropName
              ) : (
                <Skeleton className="h-7 w-40 inline-block" />
              )}
              {season?.variety && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  — {season.variety}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              Khu vực: <span className="font-medium">{zoneName}</span>
            </p>
          </div>
          {seasonStatus && (
            <Badge
              variant={seasonStatus.variant}
              className="text-sm h-fit"
            >
              {seasonStatus.label}
            </Badge>
          )}
        </div>
      </div>

      {detailQuery.isLoading ? (
        <DetailSkeleton />
      ) : !season ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sprout className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy mùa vụ.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleBack}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Crop Season Info ─────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sprout className="h-4 w-4" />
                Thông tin mùa vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Ngày trồng"
                  value={formatDate(season.plantDate)}
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Thu hoạch dự kiến"
                  value={formatDate(season.expectedHarvestDate)}
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Thu hoạch thực tế"
                  value={formatDate(season.actualHarvestDate)}
                />
                <InfoCell
                  icon={<Ruler className="h-3 w-3" />}
                  label="Diện tích (m²)"
                  value={
                    season.totalAreaSqm != null
                      ? `${season.totalAreaSqm} m²`
                      : "—"
                  }
                />
                <InfoCell
                  icon={<Layers className="h-3 w-3" />}
                  label="Số lượng cây"
                  value={season.plantCount ?? "—"}
                />
                <InfoCell
                  label="Cập nhật lần cuối"
                  value={formatDate(season.updatedAt)}
                />
              </div>

              {season.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ghi chú</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {season.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Production Milestones ────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Milestone className="h-4 w-4" />
                    Mốc sản xuất
                  </CardTitle>
                  <CardDescription>
                    {milestoneMeta
                      ? `${milestoneMeta.totalItems} mốc`
                      : "Danh sách mốc của mùa vụ"}
                  </CardDescription>
                </div>
                <Select
                  value={milestoneStatusFilter || "all"}
                  onValueChange={(v) => {
                    setMilestoneStatusFilter(
                      v === "all"
                        ? ""
                        : (v as "pending" | "in_progress" | "completed"),
                    );
                    setMilestonePage(1);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Lọc mốc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestonesQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-12 w-full"
                    />
                  ))}
                </div>
              ) : milestones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Milestone className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Không có mốc nào
                    {milestoneStatusFilter ? " với trạng thái này" : ""}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Giai đoạn</TableHead>
                          <TableHead>Dự kiến</TableHead>
                          <TableHead>Thực tế</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {milestones
                          .slice()
                          .sort((a, b) => a.milestoneOrder - b.milestoneOrder)
                          .map((milestone) => {
                            const status = MILESTONE_STATUS_MAP[
                              milestone.status
                            ] ?? {
                              label: milestone.status,
                              variant: "secondary" as const,
                            };
                            const isExpanded =
                              expandedMilestoneId === milestone.id;
                            return (
                              <>
                                <TableRow
                                  key={milestone.id}
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() =>
                                    setExpandedMilestoneId(
                                      isExpanded ? null : milestone.id,
                                    )
                                  }
                                >
                                  <TableCell className="px-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {milestone.milestoneOrder}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {milestone.stageName}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(milestone.expectedStartDate)}
                                    {milestone.expectedEndDate
                                      ? ` → ${formatDate(milestone.expectedEndDate)}`
                                      : ""}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {formatDate(milestone.actualStartDate)}
                                    {milestone.actualEndDate
                                      ? ` → ${formatDate(milestone.actualEndDate)}`
                                      : ""}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={status.variant}>
                                      {status.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Báo cáo sự cố"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(
                                          `/dashboard/owner/tickets?milestoneId=${milestone.id}&milestoneName=${encodeURIComponent(`#${milestone.milestoneOrder} ${milestone.stageName}`)}`,
                                        );
                                      }}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && (
                                  <TableRow key={`${milestone.id}-detail`}>
                                    <TableCell
                                      colSpan={7}
                                      className="p-0 border-t"
                                    >
                                      <div className="px-4 py-3 bg-muted/20">
                                        <Tabs
                                          defaultValue="iot"
                                          className="space-y-3"
                                        >
                                          <TabsList
                                            variant="line"
                                            className="w-full justify-start"
                                          >
                                            <TabsTrigger value="iot">
                                              Thiết bị IoT
                                            </TabsTrigger>
                                            <TabsTrigger value="staff">
                                              Nhiệm vụ và gán nông dân
                                            </TabsTrigger>
                                          </TabsList>
                                          <TabsContent value="iot">
                                            <MilestoneIotDetail
                                              milestoneId={milestone.id}
                                            />
                                          </TabsContent>
                                          <TabsContent value="staff">
                                            <OwnerMilestoneTasksSection
                                              milestoneId={milestone.id}
                                            />
                                          </TabsContent>
                                        </Tabs>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>

                  {milestoneMeta && milestoneMeta.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!milestoneMeta.hasPreviousPage}
                        onClick={() => setMilestonePage((p) => p - 1)}
                      >
                        Trước
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {milestoneMeta.page} / {milestoneMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!milestoneMeta.hasNextPage}
                        onClick={() => setMilestonePage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Production Requests (#56 / #57) ──────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4" />
                    Yêu cầu phê duyệt sản xuất
                  </CardTitle>
                  <CardDescription>
                    {requestMeta
                      ? `${requestMeta.totalItems} yêu cầu`
                      : "Danh sách yêu cầu từ quản lý"}
                  </CardDescription>
                </div>
                <Select
                  value={requestStatusFilter || "all"}
                  onValueChange={(v) => {
                    setRequestStatusFilter(
                      v === "all"
                        ? ""
                        : (v as "pending" | "approved" | "rejected"),
                    );
                    setRequestPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Lọc trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestsQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-12 w-full"
                    />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Không có yêu cầu nào
                    {requestStatusFilter ? " với trạng thái này" : ""}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày gửi</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Ngày phản hồi</TableHead>
                          <TableHead className="max-w-50">Mô tả</TableHead>
                          <TableHead className="w-12.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((req: ProductionRequestType) => {
                          const rs = REQUEST_STATUS_MAP[req.status] ?? {
                            label: req.status,
                            variant: "secondary" as const,
                          };
                          return (
                            <TableRow
                              key={req.id}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => onViewRequest(req.id)}
                            >
                              <TableCell className="text-sm">
                                {formatDate(req.sentAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={rs.variant}>{rs.label}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(req.repliedAt)}
                              </TableCell>
                              <TableCell className="text-sm max-w-50 truncate text-muted-foreground">
                                {req.description ?? "—"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => onViewRequest(req.id)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {requestMeta && requestMeta.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!requestMeta.hasPreviousPage}
                        onClick={() => setRequestPage((p) => p - 1)}
                      >
                        Trước
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {requestMeta.page} / {requestMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!requestMeta.hasNextPage}
                        onClick={() => setRequestPage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
