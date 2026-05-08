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
import { Coins, Cpu, Package, Ticket, Wallet } from "lucide-react";
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

// ─── Filter types ──────────────────────────────────────────────────────────
type RangePreset = "1d" | "7d" | "30d" | "90d";
type LineRange = "30d" | "12m";

const RANGE_LABEL: Record<RangePreset, string> = {
  "1d": "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
};

const LINE_RANGE_LABEL: Record<LineRange, string> = {
  "30d": "30 ngày gần nhất",
  "12m": "12 tháng gần nhất",
};

// ─── Color palette (palette-friendly, color-blind aware) ──────────────────
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];
const IOT_COLORS = ["#0ea5e9", "#14b8a6", "#6366f1", "#f97316"];
const TICKET_COLORS = ["#ec4899", "#22c55e", "#eab308", "#a855f7"];

const REVENUE_TOTAL_COLOR = "#0f766e";
const REVENUE_SUB_COLOR = "#10b981";
const REVENUE_TICKET_COLOR = "#ec4899";
const REVENUE_IOT_COLOR = "#0ea5e9";

// ─── Mock helpers ─────────────────────────────────────────────────────────
const RANGE_DAYS: Record<RangePreset, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const RANGE_FACTOR: Record<RangePreset, number> = {
  "1d": 1,
  "7d": 6.4,
  "30d": 25,
  "90d": 70,
};

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

// Mocked KPI numbers per range
function buildKpis(range: RangePreset) {
  const f = RANGE_FACTOR[range];
  const subscription = Math.round(48_500_000 * f);
  const iot = Math.round(22_300_000 * f);
  const ticket = Math.round(11_900_000 * f);
  const total = subscription + iot + ticket;
  return { total, subscription, iot, ticket };
}

// Donut: subscriptions by plan
function buildSubPlans(range: RangePreset) {
  const f = RANGE_FACTOR[range];
  return [
    { name: "Gói Cơ Bản", value: Math.round(58 * f) },
    { name: "Gói Tiêu Chuẩn", value: Math.round(42 * f) },
    { name: "Gói Cao Cấp", value: Math.round(24 * f) },
    { name: "Gói Doanh Nghiệp", value: Math.round(10 * f) },
  ];
}

function buildIotAddons(range: RangePreset) {
  const f = RANGE_FACTOR[range];
  return [
    { name: "Gói IoT Khởi Đầu", value: Math.round(34 * f) },
    { name: "Gói IoT Tiêu Chuẩn", value: Math.round(22 * f) },
    { name: "Gói IoT Nâng Cao", value: Math.round(15 * f) },
    { name: "Gói IoT Doanh Nghiệp", value: Math.round(11 * f) },
  ];
}

function buildTicketAddons(range: RangePreset) {
  const f = RANGE_FACTOR[range];
  return [
    { name: "Gói 10 lượt", value: Math.round(60 * f) },
    { name: "Gói 25 lượt", value: Math.round(34 * f) },
    { name: "Gói 50 lượt", value: Math.round(18 * f) },
    { name: "Gói 100 lượt", value: Math.round(7 * f) },
  ];
}

// Time-series for line charts
function buildSeries(range: LineRange, base: number, jitter = 0.35) {
  const points = range === "30d" ? 30 : 12;
  const out: { label: string; value: number }[] = [];
  for (let i = 0; i < points; i++) {
    const wave = 1 + Math.sin(i / 2.3) * jitter + (i / points) * 0.2;
    const value = Math.round(base * wave);
    if (range === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - (points - 1 - i));
      out.push({
        label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        value,
      });
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() - (points - 1 - i));
      out.push({
        label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`,
        value,
      });
    }
  }
  return out;
}

// ─── Sub-components ───────────────────────────────────────────────────────
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

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}

function KpiCard({ title, value, icon: Icon, accent }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums truncate">{value}</p>
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

// ── Donut chart: subscription plans ────────────────────────────────────────
function SubscriptionDonutCard({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Số lượng gói đã đăng ký</CardTitle>
        <CardDescription>Phân bổ theo loại gói</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(v, _n, p: { payload?: { name?: string } }) => {
                  const num = Number(v);
                  return [
                    `${num} gói (${((num / total) * 100).toFixed(1)}%)`,
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
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{d.name}</span>
            </div>
          ))}
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
                    ({((d.value / total) * 100).toFixed(0)}%)
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

// ── Bar chart card ─────────────────────────────────────────────────────────
interface BarChartCardProps {
  title: string;
  description: string;
  data: { name: string; value: number }[];
  colors: string[];
  totalLabel: string;
}

function BarChartCard({
  title,
  description,
  data,
  colors,
  totalLabel,
}: BarChartCardProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                type="number"
                tickFormatter={compactNum}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={110}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
                formatter={(v) => [`${Number(v)} gói`, "Số lượng"]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-muted-foreground truncate">{d.name}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">{totalLabel}</p>
          <p className="text-xl font-bold tabular-nums">{total}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Line chart card with own filter ────────────────────────────────────────
interface RevenueLineCardProps {
  title: string;
  description: string;
  base: number;
  color: string;
}

function RevenueLineCard({ title, description, base, color }: RevenueLineCardProps) {
  const [range, setRange] = useState<LineRange>("30d");
  const data = useMemo(() => buildSeries(range, base), [range, base]);
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
        <RangeFilter<LineRange>
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={compactVnd}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={48}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(v) => [formatCurrencyVnd(Number(v)), "Doanh thu"]}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1 }}
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
        </div>
      </CardContent>
    </Card>
  );
}

// ── Transactions mock table ────────────────────────────────────────────────
type TxCategory = "ALL" | "SUBSCRIPTION" | "IOT" | "TICKET";

const TX_CATEGORY_LABEL: Record<Exclude<TxCategory, "ALL">, string> = {
  SUBSCRIPTION: "Gói đăng ký",
  IOT: "Mua thêm IoT",
  TICKET: "Mua thêm Ticket",
};

const TX_CATEGORY_COLOR: Record<Exclude<TxCategory, "ALL">, string> = {
  SUBSCRIPTION: "bg-emerald-100 text-emerald-700",
  IOT: "bg-sky-100 text-sky-700",
  TICKET: "bg-pink-100 text-pink-700",
};

interface TxRow {
  id: string;
  invoiceNumber: string;
  category: Exclude<TxCategory, "ALL">;
  customer: string;
  amount: number;
  status: "PAID" | "OPEN" | "VOID";
  paidAt: string;
}

const STATUS_LABEL: Record<TxRow["status"], string> = {
  PAID: "Đã thanh toán",
  OPEN: "Chờ thanh toán",
  VOID: "Đã hủy",
};

const STATUS_COLOR: Record<TxRow["status"], string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  OPEN: "bg-amber-100 text-amber-700",
  VOID: "bg-slate-200 text-slate-700",
};

function buildTransactions(): TxRow[] {
  const customers = [
    "Trang trại Minh Khang",
    "Trang trại An Phú",
    "HTX Đồng Xanh",
    "Nông trại 9 Tầng",
    "Vườn Sinh Thái Hòa Bình",
    "Trang trại Bốn Mùa",
    "HTX Lúa Vàng",
    "Vườn Tre Xanh",
  ];
  const cats: Exclude<TxCategory, "ALL">[] = ["SUBSCRIPTION", "IOT", "TICKET"];
  const statuses: TxRow["status"][] = ["PAID", "PAID", "PAID", "OPEN", "VOID"];
  const out: TxRow[] = [];
  for (let i = 0; i < 56; i++) {
    const cat = cats[i % cats.length];
    const baseAmount =
      cat === "SUBSCRIPTION" ? 1_990_000 : cat === "IOT" ? 4_500_000 : 690_000;
    const amount = baseAmount * (1 + ((i * 7) % 5) * 0.15);
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      id: `tx_${i}`,
      invoiceNumber: `INV-2026${String(1000 + i).padStart(4, "0")}`,
      category: cat,
      customer: customers[i % customers.length],
      amount: Math.round(amount),
      status: statuses[i % statuses.length],
      paidAt: d.toISOString(),
    });
  }
  return out;
}

const ALL_TX = buildTransactions();

function TransactionsTable() {
  const [range, setRange] = useState<RangePreset>("90d");
  const [category, setCategory] = useState<TxCategory>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[range];
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    return ALL_TX.filter((t) => {
      if (new Date(t.paidAt).getTime() < cutoff) return false;
      if (category !== "ALL" && t.category !== category) return false;
      if (
        search &&
        !t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) &&
        !t.customer.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [range, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">Danh sách giao dịch</CardTitle>
          <CardDescription>
            Tổng {filtered.length} giao dịch trong{" "}
            {RANGE_LABEL[range].toLowerCase()}
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
              setCategory(v as TxCategory);
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
              {slice.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có giao dịch phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {slice.map((tx) => (
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
                        STATUS_COLOR[tx.status],
                      )}
                    >
                      {STATUS_LABEL[tx.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(tx.paidAt).toLocaleString("vi-VN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {safePage}/{totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
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

// ─── Page ──────────────────────────────────────────────────────────────────
function AdminRevenuePage() {
  const [kpiRange, setKpiRange] = useState<RangePreset>("1d");
  const [chartRange, setChartRange] = useState<RangePreset>("1d");

  const kpis = useMemo(() => buildKpis(kpiRange), [kpiRange]);

  const subPlans = useMemo(() => buildSubPlans(chartRange), [chartRange]);
  const iotAddons = useMemo(() => buildIotAddons(chartRange), [chartRange]);
  const ticketAddons = useMemo(() => buildTicketAddons(chartRange), [chartRange]);

  const rangeOpts = (Object.keys(RANGE_LABEL) as RangePreset[]).map((r) => ({
    value: r,
    label: RANGE_LABEL[r],
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Badge className="mb-2">Báo cáo tài chính</Badge>
        <h1 className="text-2xl font-bold">Quản lý doanh thu</h1>
        <p className="text-muted-foreground">
          Theo dõi tổng doanh thu, cơ cấu nguồn thu và biến động dòng tiền.
        </p>
      </div>

      {/* KPI section */}
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
            value={formatCurrencyVnd(kpis.total)}
            icon={Wallet}
            accent="bg-emerald-100 text-emerald-700"
          />
          <KpiCard
            title="Doanh thu gói đăng ký"
            value={formatCurrencyVnd(kpis.subscription)}
            icon={Package}
            accent="bg-teal-100 text-teal-700"
          />
          <KpiCard
            title="Doanh thu mua thêm IoT"
            value={formatCurrencyVnd(kpis.iot)}
            icon={Cpu}
            accent="bg-sky-100 text-sky-700"
          />
          <KpiCard
            title="Doanh thu mua thêm Ticket"
            value={formatCurrencyVnd(kpis.ticket)}
            icon={Ticket}
            accent="bg-pink-100 text-pink-700"
          />
        </div>
      </section>

      {/* Distribution charts */}
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
          <SubscriptionDonutCard data={subPlans} />
          <BarChartCard
            title="Số lượng gói IoT đã mua thêm"
            description="Phân bổ theo từng loại gói"
            data={iotAddons}
            colors={IOT_COLORS}
            totalLabel="Tổng số gói IoT đã mua"
          />
          <BarChartCard
            title="Số lượng gói Ticket đã mua thêm"
            description="Phân bổ theo từng gói lượt"
            data={ticketAddons}
            colors={TICKET_COLORS}
            totalLabel="Tổng số gói Ticket đã mua"
          />
        </div>
      </section>

      {/* Line charts — each with its own range filter */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Biến động dòng tiền theo thời gian
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <RevenueLineCard
            title="Tổng doanh thu"
            description="Toàn bộ nguồn thu cộng lại"
            base={82_700_000}
            color={REVENUE_TOTAL_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu gói đăng ký"
            description="Gói đăng ký mới và gia hạn"
            base={48_500_000}
            color={REVENUE_SUB_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu mua thêm Ticket"
            description="Các gói lượt ticket bán thêm"
            base={11_900_000}
            color={REVENUE_TICKET_COLOR}
          />
          <RevenueLineCard
            title="Doanh thu mua thêm IoT"
            description="Thiết bị / cảm biến mua thêm"
            base={22_300_000}
            color={REVENUE_IOT_COLOR}
          />
        </div>
      </section>

      {/* Transactions */}
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
