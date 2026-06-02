import { Link } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  Truck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import {
  useAdminIotOverview,
  useAdminRecoveryQueue,
} from "@/queries/useIotDeviceAdminOps";
import { cn } from "@/lib/utils";

const LIST_BASE = "/dashboard/admin/iot-devices";
const KIT_REQUESTS_INSTALL =
  "/dashboard/admin/iot-kit-requests?type=INSTALL_SCHEDULE&status=pending";
const KIT_REQUESTS_RECOVERY =
  "/dashboard/admin/iot-kit-requests?type=RECOVERY_SCHEDULE&status=pending";
const KIT_REQUESTS_FAULT =
  "/dashboard/admin/iot-kit-requests?type=FAULT_REPORT&status=pending";

export default function AdminIotDashboardPage() {
  const overviewQuery = useAdminIotOverview();
  const overview = overviewQuery.data?.data;

  // Summary nhẹ cho task thu hồi — pageSize=1 chỉ lấy meta
  const recoveryQuery = useAdminRecoveryQueue({
    groupBy: "farm-zone",
    page: 1,
    pageSize: 1,
  });
  const recoveryPending = recoveryQuery.data?.data?.totalDevicesPending ?? 0;
  const recoveryOldestDays =
    recoveryQuery.data?.data?.oldestOverdueDays ?? 0;

  const handleRefresh = () => {
    overviewQuery.refetch();
    recoveryQuery.refetch();
  };

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <LoadingCard rows={4} />
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (overviewQuery.isError || !overview) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          message="Không thể tải tổng quan IoT. Vui lòng thử lại."
          onRetry={() => overviewQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tổng quan thiết bị IoT
          </h1>
          <p className="text-sm text-muted-foreground">
            Landing buổi sáng — xem nhanh "có gì cần làm hôm nay" và tình trạng
            kho.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          aria-label="Tải lại dashboard"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
          Làm mới
        </Button>
      </header>

      {/* ── Hôm nay cần xử lý ───────────────────────────────────── */}
      <section aria-labelledby="action-required-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="action-required-heading"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Hôm nay cần xử lý
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <ActionRequiredCard
            tone="danger"
            icon={AlertCircle}
            title={`${overview.actionRequired.errorDevices.count} thiết bị có lỗi cần xử lý`}
            description={
              overview.actionRequired.errorDevices.oldest
                ? `Thiết bị cũ nhất: ${overview.actionRequired.errorDevices.oldest.label} · đã lỗi ${overview.actionRequired.errorDevices.oldest.ageDays} ngày`
                : "Không có thiết bị lỗi nào."
            }
            actionLabel="Xem yêu cầu báo lỗi"
            href={KIT_REQUESTS_FAULT}
          />
          <ActionRequiredCard
            tone="warning"
            icon={Clock3}
            title={`${overview.actionRequired.pendingInstall.count} thiết bị đợi cài đặt`}
            description={
              overview.actionRequired.pendingInstall.oldest
                ? `Thiết bị cũ nhất: ${overview.actionRequired.pendingInstall.oldest.label} · đã chờ ${overview.actionRequired.pendingInstall.oldest.ageDays} ngày`
                : "Không có thiết bị nào đang chờ."
            }
            actionLabel="Mở yêu cầu cần lắp đặt"
            href={KIT_REQUESTS_INSTALL}
          />
          <ActionRequiredCard
            tone="warning"
            icon={Undo2}
            title={`${recoveryPending} thiết bị cần thu hồi`}
            description={
              recoveryPending > 0
                ? `Quá hạn lâu nhất: ${recoveryOldestDays} ngày`
                : "Không có thiết bị nào quá hạn cần thu hồi."
            }
            actionLabel="Mở yêu cầu cần thu lại"
            href={KIT_REQUESTS_RECOVERY}
          />
        </div>
      </section>

      {/* ── Hoạt động 24h ───────────────────────────────────────── */}
      <section aria-labelledby="activity-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="activity-heading"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Hoạt động 24 giờ qua
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ActivityStat
            icon={RefreshCw}
            label="Lượt thay thế thiết bị"
            value={overview.recentActivity.newSwaps}
            hint="Số lần thay vi xử lý"
          />
          <ActivityStat
            icon={CreditCard}
            label="Đơn kit đã thanh toán"
            value={overview.recentActivity.newPaidOrders}
            hint="Đơn chuyển sang PAID"
          />
          <ActivityStat
            icon={CheckCircle2}
            label="Thiết bị bắt đầu hoạt động"
            value={overview.recentActivity.devicesActivated}
            hint="Số vi xử lý chuyển sang Hoạt động"
          />
        </div>
      </section>

      {/* ── Lối tắt ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lối tắt</CardTitle>
          <CardDescription>
            Truy cập nhanh các trang quản lý liên quan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            to={LIST_BASE}
            icon={Boxes}
            title="Quản lý thiết bị"
            hint="Tìm kiếm, lọc, thao tác hàng loạt"
          />
          <QuickLink
            to={KIT_REQUESTS_INSTALL}
            icon={Truck}
            title="Yêu cầu cần lắp đặt"
            hint="Lịch lắp do hệ thống tạo theo mùa vụ"
          />
          <QuickLink
            to={KIT_REQUESTS_RECOVERY}
            icon={Undo2}
            title="Yêu cầu cần thu lại"
            hint="Lịch thu hồi khi gói thuê hết hạn"
          />
          <QuickLink
            to="/dashboard/admin/iot-kits"
            icon={Package}
            title="Bộ kit IoT"
            hint="Danh mục bộ kit"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

interface ActionRequiredCardProps {
  tone: "danger" | "warning";
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

const ACTION_TONE: Record<
  ActionRequiredCardProps["tone"],
  { ring: string; iconBg: string; iconColor: string }
> = {
  danger: {
    ring: "border-red-200 dark:border-red-900/60",
    iconBg: "bg-red-100 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    ring: "border-amber-200 dark:border-amber-900/60",
    iconBg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
};

function ActionRequiredCard({
  tone,
  icon: Icon,
  title,
  description,
  actionLabel,
  href,
}: ActionRequiredCardProps) {
  const styles = ACTION_TONE[tone];
  return (
    <Link
      to={href}
      aria-label={actionLabel}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={cn(
          "border-l-4 transition hover:border-foreground/30 hover:bg-muted/40 hover:shadow-sm",
          styles.ring,
        )}
      >
        <CardContent className="flex items-start gap-4 p-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              styles.iconBg,
            )}
            aria-hidden
          >
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <span
            className="mt-0.5 inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-muted-foreground transition group-hover:text-foreground"
            aria-hidden
          >
            Xem
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

interface ActivityStatProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  hint?: string;
}

function ActivityStat({ icon: Icon, label, value, hint }: ActivityStatProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint: string;
}

function QuickLink({ to, icon: Icon, title, hint }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-md border p-3 transition hover:border-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight
        className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
