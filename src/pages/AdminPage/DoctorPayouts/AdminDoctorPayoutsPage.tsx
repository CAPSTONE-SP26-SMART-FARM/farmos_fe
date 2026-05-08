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
import { CheckCircle2, ClipboardList, HandCoins, Wallet } from "lucide-react";
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

function buildKpis(range: RangePreset) {
  const f = RANGE_FACTOR[range];
  const projected = Math.round(36_500_000 * f);
  const paid = Math.round(28_900_000 * f);
  const requests = Math.round(48 * f);
  const requestsResolved = Math.round(36 * f);
  return { projected, paid, requests, requestsResolved };
}

function buildSeries(range: LineRange, base: number) {
  const points = range === "30d" ? 30 : 12;
  const out: { label: string; value: number }[] = [];
  for (let i = 0; i < points; i++) {
    const wave = 1 + Math.sin(i / 1.9) * 0.32 + (i / points) * 0.15;
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
  hint?: string;
}
function KpiCard({ title, value, icon: Icon, accent, hint }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums truncate">{value}</p>
            {hint && (
              <p className="text-xs text-muted-foreground">{hint}</p>
            )}
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

// Line chart — paid amounts over time
function PaidLineChartCard() {
  const [range, setRange] = useState<LineRange>("30d");
  const data = useMemo(() => buildSeries(range, 18_400_000), [range]);
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                formatter={(v) => [formatCurrencyVnd(Number(v)), "Đã chi trả"]}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.1 }}
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
        </div>
      </CardContent>
    </Card>
  );
}

// ── Withdrawals mock table ─────────────────────────────────────────────────
type PayoutCategory = "ALL" | "BANK" | "EWALLET";
type PayoutStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";
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

interface PayoutRow {
  id: string;
  refNumber: string;
  doctor: string;
  category: Exclude<PayoutCategory, "ALL">;
  amount: number;
  status: PayoutStatus;
  requestedAt: string;
}

function buildPayouts(): PayoutRow[] {
  const doctors = [
    "BS. Nguyễn Văn An",
    "BS. Trần Thị Bình",
    "BS. Lê Hoàng Cường",
    "BS. Phạm Quỳnh Dao",
    "BS. Hoàng Minh Đức",
    "BS. Vũ Thị Hà",
    "BS. Đỗ Trung Kiên",
    "BS. Bùi Thanh Lan",
  ];
  const cats: Exclude<PayoutCategory, "ALL">[] = ["BANK", "EWALLET"];
  const statuses: PayoutStatus[] = [
    "PAID",
    "PAID",
    "APPROVED",
    "PENDING",
    "REJECTED",
    "PAID",
  ];
  const out: PayoutRow[] = [];
  for (let i = 0; i < 48; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      id: `pay_${i}`,
      refNumber: `WTH-2026${String(800 + i).padStart(4, "0")}`,
      doctor: doctors[i % doctors.length],
      category: cats[i % cats.length],
      amount: Math.round((1_500_000 + (i % 7) * 450_000) * 1),
      status: statuses[i % statuses.length],
      requestedAt: d.toISOString(),
    });
  }
  return out;
}

const ALL_PAYOUTS = buildPayouts();

function PayoutsTable() {
  const [range, setRange] = useState<RangePreset>("90d");
  const [category, setCategory] = useState<PayoutCategory>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const cutoff = Date.now() - RANGE_DAYS[range] * 24 * 3600 * 1000;
    return ALL_PAYOUTS.filter((p) => {
      if (new Date(p.requestedAt).getTime() < cutoff) return false;
      if (category !== "ALL" && p.category !== category) return false;
      if (
        search &&
        !p.refNumber.toLowerCase().includes(search.toLowerCase()) &&
        !p.doctor.toLowerCase().includes(search.toLowerCase())
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
          <CardTitle className="text-base">Lịch sử thanh toán bác sĩ</CardTitle>
          <CardDescription>
            Tổng {filtered.length} giao dịch trong{" "}
            {RANGE_LABEL[range].toLowerCase()}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Tìm mã yêu cầu / tên bác sĩ..."
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
              setCategory(v as PayoutCategory);
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
              {slice.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có yêu cầu phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {slice.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.refNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {p.doctor}
                  </TableCell>
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

function AdminDoctorPayoutsPage() {
  const [kpiRange, setKpiRange] = useState<RangePreset>("1d");
  const kpis = useMemo(() => buildKpis(kpiRange), [kpiRange]);

  const rangeOpts = (Object.keys(RANGE_LABEL) as RangePreset[]).map((r) => ({
    value: r,
    label: RANGE_LABEL[r],
  }));

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
            value={formatCurrencyVnd(kpis.projected)}
            icon={Wallet}
            accent="bg-amber-100 text-amber-700"
            hint="Hoa hồng đã chốt nhưng chưa chi"
          />
          <KpiCard
            title="Tổng đã chi trả"
            value={formatCurrencyVnd(kpis.paid)}
            icon={HandCoins}
            accent="bg-emerald-100 text-emerald-700"
            hint="Admin đã hoàn tất thanh toán"
          />
          <KpiCard
            title="Số yêu cầu rút tiền"
            value={String(kpis.requests)}
            icon={ClipboardList}
            accent="bg-sky-100 text-sky-700"
            hint="Bác sĩ đã gửi trong kỳ"
          />
          <KpiCard
            title="Yêu cầu đã xử lý"
            value={String(kpis.requestsResolved)}
            icon={CheckCircle2}
            accent="bg-violet-100 text-violet-700"
            hint={`${Math.round((kpis.requestsResolved / Math.max(1, kpis.requests)) * 100)}% được xử lý`}
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
