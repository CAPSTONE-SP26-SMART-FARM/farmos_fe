import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Cpu, Loader2, Package, Ticket, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { formatCurrencyVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useRevenueOverview,
  useRevenueTimeseries,
  useRevenueTransactions,
} from "@/queries/useDashboard";
import type {
  RevenueLineRange,
  RevenueProductSlice,
  RevenueRange,
  RevenueSource,
  RevenueTxCategory,
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

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
const IOT_COLORS = ["#0ea5e9", "#14b8a6", "#6366f1", "#f97316"];
const TICKET_COLORS = ["#ec4899", "#22c55e", "#eab308", "#a855f7"];

const REVENUE_TOTAL_COLOR = "#0f766e";
const REVENUE_SUB_COLOR = "#10b981";
const REVENUE_TICKET_COLOR = "#ec4899";
const REVENUE_IOT_COLOR = "#0ea5e9";

function compactVnd(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function compactNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
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
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums truncate">
              {loading ? <Loader2 className="size-5 animate-spin" /> : value}
            </p>
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

function SubscriptionDonutCard({ data }: { data: RevenueProductSlice[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Số lượng gói đã đăng ký</CardTitle>
        <CardDescription>Phân bổ theo loại gói</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="h-52 w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Không có dữ liệu trong kỳ.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(v, _n, p: { payload?: { name?: string } }) => {
                    const num = Number(v);
                    return [
                      `${num} gói (${total ? ((num / total) * 100).toFixed(1) : 0}%)`,
                      p?.payload?.name ?? "",
                    ];
                  }}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Tổng số gói</p>
          <p className="text-xl font-bold tabular-nums">{total}</p>
          <ul className="mt-2 space-y-0.5 text-xs">
            {data.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {d.name}
                </span>
                <span className="tabular-nums font-medium">
                  {d.value}{" "}
                  <span className="text-muted-foreground">
                    ({total ? ((d.value / total) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  description,
  data,
  colors,
  totalLabel,
}: {
  title: string;
  description: string;
  data: RevenueProductSlice[];
  colors: string[];
  totalLabel: string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="h-52 w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Không có dữ liệu trong kỳ.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={compactNum} fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={110} />
                <Tooltip formatter={(v) => [`${Number(v)} gói`, "Số lượng"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
          <p className="text-xl font-bold tabular-nums">{total}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueLineCard({
  title,
  description,
  source,
  color,
}: {
  title: string;
  description: string;
  source: RevenueSource;
  color: string;
}) {
  const [range, setRange] = useState<RevenueLineRange>("30d");
  const query = useRevenueTimeseries(source, range);
  const data = query.data?.data?.data ?? [];
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>
            {description} · Tổng {formatCurrencyVnd(total)}
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
        <div className="h-56 w-full">
          {query.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis tickFormatter={compactVnd} fontSize={11} width={48} />
                <Tooltip
                  formatter={(v) => [formatCurrencyVnd(Number(v)), "Doanh thu"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2.2}
                  dot={{ r: 2, fill: color }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const TX_CATEGORY_LABEL: Record<RevenueTxCategory, string> = {
  SUBSCRIPTION: "Gói đăng ký",
  IOT: "Mua thêm IoT",
  TICKET: "Mua thêm Ticket",
};

const TX_CATEGORY_COLOR: Record<RevenueTxCategory, string> = {
  SUBSCRIPTION: "bg-emerald-100 text-emerald-700",
  IOT: "bg-sky-100 text-sky-700",
  TICKET: "bg-pink-100 text-pink-700",
};

const TX_STATUS_LABEL: Record<string, string> = {
  PAID: "Đã thanh toán",
  OPEN: "Chờ thanh toán",
  VOID: "Đã hủy",
};

const TX_STATUS_COLOR: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  OPEN: "bg-amber-100 text-amber-700",
  VOID: "bg-slate-200 text-slate-700",
};

function TransactionsTable() {
  const [range, setRange] = useState<RangePreset>("90d");
  const [category, setCategory] = useState<"ALL" | RevenueTxCategory>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useRevenueTransactions({
    range,
    category: category === "ALL" ? undefined : category,
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
          <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
          <CardDescription>
            Tổng {totalItems} giao dịch trong {RANGE_LABEL[range].toLowerCase()}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Tìm mã hóa đơn / khách hàng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-8 w-[240px] text-xs"
          />
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as "ALL" | RevenueTxCategory);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue placeholder="Loại giao dịch" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="ALL">Tất cả nguồn thu</SelectItem>
              <SelectItem value="SUBSCRIPTION">Gói đăng ký</SelectItem>
              <SelectItem value="IOT">Mua thêm IoT</SelectItem>
              <SelectItem value="TICKET">Mua thêm Ticket</SelectItem>
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
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có giao dịch phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          TX_CATEGORY_COLOR[tx.category],
                        )}
                      >
                        {TX_CATEGORY_LABEL[tx.category]}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {tx.customer}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrencyVnd(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          TX_STATUS_COLOR[tx.status],
                        )}
                      >
                        {TX_STATUS_LABEL[tx.status] ?? tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {tx.paidAt
                        ? new Date(tx.paidAt).toLocaleString("vi-VN")
                        : "—"}
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

function AdminRevenuePage() {
  const [kpiRange, setKpiRange] = useState<RangePreset>("30d");
  const [chartRange, setChartRange] = useState<RangePreset>("30d");

  const overviewQuery = useRevenueOverview(kpiRange, chartRange);
  const overview = overviewQuery.data?.data;
  const kpis = overview?.kpis;
  const breakdown = overview?.productBreakdown;

  const rangeOpts = useMemo(
    () =>
      (Object.keys(RANGE_LABEL) as RangePreset[]).map((r) => ({
        value: r,
        label: RANGE_LABEL[r],
      })),
    [],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Báo cáo tài chính</Badge>
        <h1 className="text-2xl font-bold">Quản lý doanh thu</h1>
        <p className="text-muted-foreground">
          Theo dõi tổng doanh thu, cơ cấu nguồn thu và biến động dòng tiền.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Doanh thu theo nguồn — {RANGE_LABEL[kpiRange]}
          </h2>
          <RangeFilter<RangePreset>
            value={kpiRange}
            onChange={setKpiRange}
            options={rangeOpts}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Tổng doanh thu"
            value={formatCurrencyVnd(kpis?.total ?? 0)}
            icon={Wallet}
            accent="bg-emerald-100 text-emerald-700"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Doanh thu gói đăng ký"
            value={formatCurrencyVnd(kpis?.subscription ?? 0)}
            icon={Package}
            accent="bg-teal-100 text-teal-700"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Doanh thu mua thêm IoT"
            value={formatCurrencyVnd(kpis?.iot ?? 0)}
            icon={Cpu}
            accent="bg-sky-100 text-sky-700"
            loading={overviewQuery.isLoading}
          />
          <KpiCard
            title="Doanh thu mua thêm Ticket"
            value={formatCurrencyVnd(kpis?.ticket ?? 0)}
            icon={Ticket}
            accent="bg-pink-100 text-pink-700"
            loading={overviewQuery.isLoading}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Cơ cấu sản phẩm — {RANGE_LABEL[chartRange]}
          </h2>
          <RangeFilter<RangePreset>
            value={chartRange}
            onChange={setChartRange}
            options={rangeOpts}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <SubscriptionDonutCard data={breakdown?.subscriptionPlans ?? []} />
          <BarChartCard
            title="Số lượng gói IoT đã mua thêm"
            description="Phân bổ theo từng loại gói"
            data={breakdown?.iotKits ?? []}
            colors={IOT_COLORS}
            totalLabel="Tổng số gói IoT đã mua"
          />
          <BarChartCard
            title="Số lượng gói Ticket đã mua thêm"
            description="Phân bổ theo từng gói lượt"
            data={breakdown?.ticketPackages ?? []}
            colors={TICKET_COLORS}
            totalLabel="Tổng số gói Ticket đã mua"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Biến động dòng tiền theo thời gian
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <RevenueLineCard
            title="Tổng doanh thu"
            description="Toàn bộ nguồn thu cộng lại"
            source="total"
            color={REVENUE_TOTAL_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu gói đăng ký"
            description="Gói đăng ký mới và gia hạn"
            source="subscription"
            color={REVENUE_SUB_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu mua thêm Ticket"
            description="Các gói lượt ticket bán thêm"
            source="ticket"
            color={REVENUE_TICKET_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu mua thêm IoT"
            description="Thiết bị / cảm biến mua thêm"
            source="iot"
            color={REVENUE_IOT_COLOR}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          <Coins className="mr-1 inline-block size-4 align-text-bottom" />
          Lịch sử giao dịch
        </h2>
        <TransactionsTable />
      </section>
    </div>
  );
}

export default AdminRevenuePage;
