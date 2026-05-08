import DatePickerField from "@/components/common/DatePickerField";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/common/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { TIER_BADGE_CLASS, TIER_LABEL } from "@/constants/ticketQualityLabels";
import { useDqsLeaderboard } from "@/queries/useDqs";
import {
  type DqsLeaderboardQueryType,
  type LeaderboardRowType,
  type TierType,
} from "@/schemaValidatation/dqs";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

// ── Page Admin — DQS Leaderboard (B16) ───────────────────────────────────
// BE trả flat array {data: LeaderboardRow[]}, không pagination. FE filter
// + sort + cap client-side. Date filter gửi server; tier + search filter
// client-side để giữ context sau khi đổi tier.

const TIER_TABS: Array<{ value: TierType | "all"; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "PLATINUM", label: TIER_LABEL.PLATINUM },
  { value: "GOLD", label: TIER_LABEL.GOLD },
  { value: "SILVER", label: TIER_LABEL.SILVER },
  { value: "BRONZE", label: TIER_LABEL.BRONZE },
];

// Đếm số doctor mỗi tier để render strip 4 StatCard.
function countByTier(rows: LeaderboardRowType[]): Record<TierType, number> {
  const counts: Record<TierType, number> = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
  };
  for (const r of rows) counts[r.tier]++;
  return counts;
}

export default function AdminDqsLeaderboardPage() {
  const navigate = useNavigate();

  // Date filter gửi BE (server-side). Default empty → BE dùng latest snapshot.
  const [dateFilter, setDateFilter] = useState<string>("");
  // Tier + search filter client-side để không re-fetch.
  const [tierTab, setTierTab] = useState<TierType | "all">("all");
  const [searchInput, setSearchInput] = useState("");

  const query: DqsLeaderboardQueryType = useMemo(
    () => ({
      date: dateFilter || undefined,
      // KHÔNG truyền tier qua query — để giữ count strip đầy đủ trong cache.
    }),
    [dateFilter],
  );

  const listQuery = useDqsLeaderboard(query);
  const allRows = useMemo(
    () => listQuery.data?.data?.data ?? [],
    [listQuery.data],
  );

  // Filter + sort client-side.
  const filtered = useMemo(() => {
    let rows = [...allRows];
    if (tierTab !== "all") {
      rows = rows.filter((r) => r.tier === tierTab);
    }
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.doctorName ?? "").toLowerCase().includes(q) ||
          r.doctorId.toLowerCase().includes(q),
      );
    }
    // Sort theo totalScore desc.
    rows.sort((a, b) => b.totalScore - a.totalScore);
    return rows;
  }, [allRows, tierTab, searchInput]);

  const counts = useMemo(() => countByTier(allRows), [allRows]);

  const ranked = useMemo(
    () => filtered.map((row, idx) => ({ ...row, rank: idx + 1 })),
    [filtered],
  );

  type RankedRow = LeaderboardRowType & { rank: number };

  const columns = useMemo<ColumnDef<RankedRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: () => <div className="w-12">#</div>,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.rank}
          </span>
        ),
      },
      {
        id: "doctor",
        header: "Bác sĩ",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.doctorName ?? (
                <span className="text-muted-foreground italic">
                  (chưa có tên)
                </span>
              )}
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.original.doctorId.slice(0, 8)}…
            </div>
          </div>
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
        header: () => <div className="text-right">Tổng điểm</div>,
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
    ],
    [],
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header + filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Bảng Xếp Hạng Bác Sĩ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Xếp hạng bác sĩ theo điểm chất lượng tổng hợp từ 5 tiêu chí, cập
            nhật cuối mỗi ngày.
          </p>
        </div>
        <div className="flex items-center justify-start gap-2">
          <div className="w-full md:w-64">
            <DatePickerField
              label="Ngày dữ liệu"
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Mới nhất"
              helperText="Để trống để xem bản mới nhất"
            />
          </div>
          {/* BE chưa emit `dqs.tier_changed` event → A4 không tự refresh
              khi cron đêm chạy. Cung cấp button refresh thủ công. */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 ${listQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Strip 4 StatCard tier — luôn render từ allRows (không bị tier filter) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Bạch kim"
          value={counts.PLATINUM}
          icon={Trophy}
          tone="success"
        />
        <StatCard
          label="Vàng"
          value={counts.GOLD}
          icon={Trophy}
          tone="warning"
        />
        <StatCard
          label="Bạc"
          value={counts.SILVER}
          icon={Trophy}
          tone="default"
        />
        <StatCard
          label="Đồng"
          value={counts.BRONZE}
          icon={Trophy}
          tone="default"
        />
      </div>

      {/* Card chính: bảng xếp hạng */}
      <Card>
        <CardHeader>
          <CardTitle>Xếp hạng chi tiết</CardTitle>
          <CardDescription>
            Phân tích điểm chất lượng theo 5 tiêu chí: đánh giá sao (40%), tần
            suất xử lý (20%), đúng hạn (20%), tỷ lệ nhận ticket (10%) và thời
            lượng trực tuyến (10%). Bấm vào một dòng để xem chi tiết bác sĩ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={tierTab}
              onValueChange={(v) => setTierTab(v as TierType | "all")}
              className="w-auto"
            >
              <TabsList>
                {TIER_TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative ml-auto w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên bác sĩ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {listQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không tải được bảng xếp hạng</AlertTitle>
              <AlertDescription>
                Vui lòng thử lại hoặc chọn ngày khác.
              </AlertDescription>
            </Alert>
          ) : !listQuery.isLoading && filtered.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title={
                allRows.length === 0
                  ? dateFilter
                    ? "Không có dữ liệu cho ngày đã chọn"
                    : "Chưa có dữ liệu xếp hạng"
                  : "Không có bác sĩ phù hợp bộ lọc"
              }
              description={
                allRows.length === 0
                  ? dateFilter
                    ? "Chưa có dữ liệu xếp hạng cho ngày này. Vui lòng chọn ngày khác hoặc để trống để xem bản mới nhất."
                    : "Hệ thống cập nhật xếp hạng mỗi đêm. Vui lòng quay lại sau hoặc bấm nút làm mới."
                  : "Vui lòng bỏ bớt tiêu chí lọc hoặc chọn hạng khác."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={ranked}
                isLoading={listQuery.isLoading}
                actions={[
                  {
                    key: "view",
                    label: "Xem chi tiết",
                    icon: Eye,
                    onSelect: (row) =>
                      navigate(
                        `/dashboard/admin/doctors/${row.doctorId}/dqs`,
                      ),
                  },
                ]}
                onRowClick={(row) =>
                  navigate(`/dashboard/admin/doctors/${row.doctorId}/dqs`)
                }
                emptyText="Không có bác sĩ phù hợp."
              />
              <p className="text-xs text-muted-foreground pt-3">
                Hiển thị {filtered.length}/{allRows.length} bác sĩ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
