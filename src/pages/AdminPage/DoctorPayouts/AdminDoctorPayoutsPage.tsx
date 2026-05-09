import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ClipboardList,
  HandCoins,
  Loader2,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { formatCurrencyVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  usePayoutOverview,
  usePayoutTimeseries,
  usePayoutWithdrawals,
} from "@/queries/useDashboard";
import type {
  PayoutMethod,
  PayoutStatus,
  RevenueLineRange,
  RevenueRange,
} from "@/types/dashboard";

type RangePreset = RevenueRange;

const RANGE_LABEL: Record<RangePreset, string> = {
  "1d": "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
};

const LINE_RANGE_LABEL: Record<RevenueLineRange, string> = {
  "30d": "30 ngày gần nhất",
  "12m": "12 tháng gần nhất",
};

function compactVnd(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

interface RangeFilterProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string }>;
  width?: string;
}
function RangeFilter<T extends string>({
  value,
  onChange,
  options,
  width = "w-[140px]",
}: RangeFilterProps<T>) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className={cn("h-8 text-xs", width)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
  hint,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums truncate">
              {loading ? <Loader2 className="size-5 animate-spin" /> : value}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent,
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaidLineChartCard() {
  const [range, setRange] = useState<RevenueLineRange>("30d");
  const query = usePayoutTimeseries(range);
  const data = query.data?.data?.data ?? [];
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">Chi phí đã trả theo thời gian</CardTitle>
          <CardDescription>
            Số tiền admin đã hoàn tất thanh toán · Tổng {formatCurrencyVnd(total)}
          </CardDescription>
        </div>
        <RangeFilter<RevenueLineRange>
          value={range}
          onChange={setRange}
          options={[
            { value: "30d", label: LINE_RANGE_LABEL["30d"] },
            { value: "12m", label: LINE_RANGE_LABEL["12m"] },
          ]}
          width="w-[170px]"
        />
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {query.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis tickFormatter={compactVnd} fontSize={11} width={48} />
                <Tooltip
                  formatter={(v) => [formatCurrencyVnd(Number(v)), "Đã chi trả"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2.2}
                  fill="url(#payoutGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_LABEL: Record<PayoutStatus, string> = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã duyệt",
  PAID: "Đã thanh toán",
  REJECTED: "Từ chối",
};
const STATUS_COLOR: Record<PayoutStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

function PayoutsTable() {
  const [range, setRange] = useState<RangePreset>("90d");
  const [category, setCategory] = useState<"ALL" | PayoutMethod>("ALL");
  const [status, setStatus] = useState<"ALL" | PayoutStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = usePayoutWithdrawals({
    range,
    category: category === "ALL" ? undefined : category,
    status: status === "ALL" ? undefined : status,
    search: search || undefined,
    page,
    limit,
  });

  const rows = query.data?.data?.data ?? [];
  const meta = query.data?.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.totalItems ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">Lịch sử thanh toán bác sĩ</CardTitle>
          <CardDescription>
            Tổng {totalItems} giao dịch trong {RANGE_LABEL[range].toLowerCase()}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Tìm tên bác sĩ / số tài khoản..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 w-60 text-xs"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as "ALL" | PayoutStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as "ALL" | PayoutMethod);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Hình thức" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">Tất cả hình thức</SelectItem>
              <SelectItem value="BANK">Chuyển khoản ngân hàng</SelectItem>
              <SelectItem value="EWALLET">Ví điện tử</SelectItem>
            </SelectContent>
          </Select>
          <RangeFilter<RangePreset>
            value={range}
            onChange={(v) => {
              setRange(v);
              setPage(1);
            }}
            options={(Object.keys(RANGE_LABEL) as RangePreset[]).map((r) => ({
              value: r,
              label: RANGE_LABEL[r],
            }))}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã yêu cầu</TableHead>
                <TableHead>Bác sĩ</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian yêu cầu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có yêu cầu phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.refNumber}</TableCell>
                    <TableCell className="max-w-50 truncate">{p.doctor}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrencyVnd(p.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          STATUS_COLOR[p.status],
                        )}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {new Date(p.requestedAt).toLocaleString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDoctorPayoutsPage() {
  const [kpiRange, setKpiRange] = useState<RangePreset>("30d");
  const overviewQuery = usePayoutOverview(kpiRange);
  const kpis = overviewQuery.data?.data?.kpis;

  const rangeOpts = useMemo(
    () =>
      (Object.keys(RANGE_LABEL) as RangePreset[]).map((r) => ({
        value: r,
        label: RANGE_LABEL[r],
      })),
    [],
  );

  const resolvedPct =
    kpis && kpis.requests > 0
      ? Math.round((kpis.requestsResolved / kpis.requests) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Tài chính bác sĩ</Badge>
        <h1 className="text-2xl font-bold">Thanh toán bác sĩ</h1>
        <p className="text-muted-foreground">
          Theo dõi nghĩa vụ chi trả, yêu cầu rút tiền và tiến độ xử lý.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Chỉ số chi trả — {RANGE_LABEL[kpiRange]}
          </h2>
          <RangeFilter<RangePreset>
            value={kpiRange}
            onChange={setKpiRange}
            options={rangeOpts}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Tổng dự trù phải trả"
            value={formatCurrencyVnd(kpis?.projected ?? 0)}
            icon={Wallet}
            accent="bg-amber-100 text-amber-700"
            hint="Số dư ví bác sĩ + đang chờ rút"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Tổng đã chi trả"
            value={formatCurrencyVnd(kpis?.paid ?? 0)}
            icon={HandCoins}
            accent="bg-emerald-100 text-emerald-700"
            hint="Admin đã hoàn tất thanh toán"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Số yêu cầu rút tiền"
            value={String(kpis?.requests ?? 0)}
            icon={ClipboardList}
            accent="bg-sky-100 text-sky-700"
            hint="Bác sĩ đã gửi trong kỳ"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Yêu cầu đã xử lý"
            value={String(kpis?.requestsResolved ?? 0)}
            icon={CheckCircle2}
            accent="bg-violet-100 text-violet-700"
            hint={`${resolvedPct}% được xử lý`}
            loading={overviewQuery.isLoading}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Biến động chi phí đã chi trả
        </h2>
        <PaidLineChartCard />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Lịch sử giao dịch
        </h2>
        <PayoutsTable />
      </section>
    </div>
  );
}

export default AdminDoctorPayoutsPage;
