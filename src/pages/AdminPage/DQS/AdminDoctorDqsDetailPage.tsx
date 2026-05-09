import DatePickerField from "@/components/common/DatePickerField";
import EmptyState from "@/components/common/EmptyState";
import KpiCard from "@/components/common/KpiCard";
import LoadingCard from "@/components/common/LoadingCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DQS_SUBSCORE_HINT,
  DQS_SUBSCORE_LABEL,
  DQS_SUBSCORE_WEIGHT,
  TIER_BADGE_CLASS,
  TIER_LABEL,
} from "@/constants/ticketQualityLabels";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useDoctorDqsDetail, useDoctorDqsHistory } from "@/queries/useDqs";
import type { DqsSnapshotResType } from "@/schemaValidatation/dqs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Clock,
  Gauge,
  History,
  Info,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

// ── Page Admin — Doctor DQS Detail (B14 + B15) ──────────────────────────
// Tab Tổng quan: 5 KpiCard sub-score + Card Tier hiện tại lớn ở trên.
// Tab Lịch sử: DatePickerField from-to + Table snapshot per day.

const SUBSCORE_ICONS = {
  ratingScore: Star,
  frequencyScore: TrendingUp,
  slaScore: Target,
  acceptanceScore: Gauge,
  onlineScore: Clock,
} as const;

type SubScoreKey = keyof typeof DQS_SUBSCORE_LABEL;

function SubScoreCards({ snapshot }: { snapshot: DqsSnapshotResType }) {
  const keys: SubScoreKey[] = [
    "ratingScore",
    "frequencyScore",
    "slaScore",
    "acceptanceScore",
    "onlineScore",
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {keys.map((k) => {
        const Icon = SUBSCORE_ICONS[k];
        const value = snapshot[k];
        return (
          <Tooltip key={k}>
            <TooltipTrigger asChild>
              <div>
                <KpiCard
                  icon={Icon}
                  label={`${DQS_SUBSCORE_LABEL[k]} (${DQS_SUBSCORE_WEIGHT[k]}%)`}
                  value={value.toFixed(1)}
                  hint={`/100`}
                  tone={
                    value >= 80
                      ? "success"
                      : value >= 50
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="max-w-xs text-xs">{DQS_SUBSCORE_HINT[k]}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function AdminDoctorDqsDetailPage() {
  const { id: doctorId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detailQuery = useDoctorDqsDetail(doctorId ?? "");

  // History date range filter — default tự lấy 30 ngày gần nhất.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const historyQuery = useDoctorDqsHistory(
    doctorId ?? "",
    {
      from: from || undefined,
      to: to || undefined,
    },
    Boolean(doctorId),
  );

  if (!doctorId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Thiếu ID bác sĩ</AlertTitle>
          <AlertDescription>
            URL không hợp lệ. Vui lòng quay lại bảng hạng.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const detail = detailQuery.data?.data;
  const latest = detail?.latest;
  const history = historyQuery.data?.data?.data ?? [];
  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.snapshotDate).getTime() -
      new Date(a.snapshotDate).getTime(),
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/admin/dqs/leaderboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Chi tiết Xếp Hạng Bác Sĩ
          </h1>
          {detail?.doctorName ? (
            <p className="text-muted-foreground text-sm mt-0.5">
              {detail.doctorName}
            </p>
          ) : detailQuery.isLoading ? null : (
            <p className="text-muted-foreground text-sm font-mono mt-0.5">
              {doctorId}
            </p>
          )}
        </div>
      </div>

      {detailQuery.isLoading ? (
        <LoadingCard />
      ) : detailQuery.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tải được dữ liệu</AlertTitle>
          <AlertDescription>
            {getApiErrorMessageVi(detailQuery.error)}
          </AlertDescription>
        </Alert>
      ) : !latest ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Info}
              title="Chưa có dữ liệu xếp hạng"
              description="Bác sĩ này chưa có dữ liệu — có thể là tài khoản mới chưa đủ 30 ngày, hoặc hệ thống chưa cập nhật."
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="history">Lịch sử theo ngày</TabsTrigger>
          </TabsList>

          {/* Tổng quan tab */}
          <TabsContent
            value="overview"
            className="space-y-4"
          >
            {/* Card tier hiện tại */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Hạng hiện tại</CardTitle>
                    <CardDescription>
                      Bản dữ liệu mới nhất, được hệ thống cập nhật mỗi đêm.
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${TIER_BADGE_CLASS[latest.tier]} text-base px-3 py-1`}
                  >
                    <Award className="h-4 w-4 mr-1.5" />
                    {TIER_LABEL[latest.tier]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-bold tabular-nums">
                    {latest.totalScore.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /100 điểm chất lượng
                  </span>
                  <Separator
                    orientation="vertical"
                    className="h-6"
                  />
                  <span className="text-sm text-muted-foreground">
                    Ngày dữ liệu:{" "}
                    {format(new Date(latest.snapshotDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    Tính trong {latest.windowDays} ngày gần nhất
                  </span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    Cập nhật lúc{" "}
                    {format(new Date(latest.computedAt), "HH:mm dd/MM", {
                      locale: vi,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Sub-score cards */}
            <Card>
              <CardHeader>
                <CardTitle>Phân tích 5 tiêu chí</CardTitle>
                <CardDescription>
                  Từng tiêu chí thành phần với trọng số đóng góp vào điểm
                  tổng. Di chuột vào biểu tượng để xem giải thích chi tiết.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubScoreCards snapshot={latest} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lịch sử tab */}
          <TabsContent
            value="history"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Lịch sử xếp hạng theo ngày
                </CardTitle>
                <CardDescription>
                  Lọc theo khoảng ngày để xem dữ liệu từng ngày của bác sĩ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DatePickerField
                    label="Từ ngày"
                    value={from}
                    onChange={(v) => {
                      setFrom(v);
                      if (v && to && to < v) setTo("");
                    }}
                    placeholder="Bắt đầu"
                  />
                  <DatePickerField
                    label="Đến ngày"
                    value={to}
                    onChange={setTo}
                    placeholder="Kết thúc"
                    minDate={from ? new Date(from) : undefined}
                    helperText={from ? `Phải ≥ ${format(new Date(from), "dd/MM/yyyy", { locale: vi })}` : undefined}
                  />
                  <div className="flex items-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFrom("");
                        setTo("");
                      }}
                      disabled={!from && !to}
                    >
                      Xoá lọc
                    </Button>
                  </div>
                </div>

                <Separator />

                {!historyQuery.isLoading && sortedHistory.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="Không có dữ liệu"
                    description="Không có dữ liệu xếp hạng trong khoảng thời gian đã chọn."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <DataTable
                      columns={
                        [
                          {
                            accessorKey: "snapshotDate",
                            header: "Ngày",
                            cell: ({ row }) => (
                              <span className="text-sm">
                                {format(
                                  new Date(row.original.snapshotDate),
                                  "dd/MM/yyyy",
                                  { locale: vi },
                                )}
                              </span>
                            ),
                          },
                          {
                            accessorKey: "tier",
                            header: "Hạng",
                            cell: ({ row }) => (
                              <Badge
                                variant="outline"
                                className={TIER_BADGE_CLASS[row.original.tier]}
                              >
                                {TIER_LABEL[row.original.tier]}
                              </Badge>
                            ),
                          },
                          {
                            accessorKey: "totalScore",
                            header: () => (
                              <div className="text-right">Tổng điểm</div>
                            ),
                            cell: ({ row }) => (
                              <div className="text-right font-semibold tabular-nums">
                                {row.original.totalScore.toFixed(1)}
                              </div>
                            ),
                          },
                          {
                            accessorKey: "ratingScore",
                            header: () => <div className="text-right">Đánh giá</div>,
                            cell: ({ row }) => (
                              <div className="text-right text-sm tabular-nums">
                                {row.original.ratingScore.toFixed(1)}
                              </div>
                            ),
                          },
                          {
                            accessorKey: "frequencyScore",
                            header: () => <div className="text-right">Tần suất</div>,
                            cell: ({ row }) => (
                              <div className="text-right text-sm tabular-nums">
                                {row.original.frequencyScore.toFixed(1)}
                              </div>
                            ),
                          },
                          {
                            accessorKey: "slaScore",
                            header: () => <div className="text-right">Đúng hạn</div>,
                            cell: ({ row }) => (
                              <div className="text-right text-sm tabular-nums">
                                {row.original.slaScore.toFixed(1)}
                              </div>
                            ),
                          },
                          {
                            accessorKey: "acceptanceScore",
                            header: () => <div className="text-right">Tỷ lệ nhận</div>,
                            cell: ({ row }) => (
                              <div className="text-right text-sm tabular-nums">
                                {row.original.acceptanceScore.toFixed(1)}
                              </div>
                            ),
                          },
                          {
                            accessorKey: "onlineScore",
                            header: () => <div className="text-right">Trực tuyến</div>,
                            cell: ({ row }) => (
                              <div className="text-right text-sm tabular-nums">
                                {row.original.onlineScore.toFixed(1)}
                              </div>
                            ),
                          },
                        ] as ColumnDef<(typeof sortedHistory)[number]>[]
                      }
                      data={sortedHistory}
                      isLoading={historyQuery.isLoading}
                      emptyText="Không có dữ liệu."
                    />
                    <p className="text-xs text-muted-foreground pt-3">
                      {sortedHistory.length} bản ghi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
