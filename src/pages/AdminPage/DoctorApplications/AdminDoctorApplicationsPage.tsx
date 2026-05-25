import {
  CheckCircle2,
  Clock,
  PauseCircle,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import DoctorApplicationDetailDialog from "./DoctorApplicationDetailDialog";
import DoctorApplicationsTable from "./DoctorApplicationsTable";

type StatTone = "amber" | "emerald" | "rose" | "slate";

const TONE_CLASS: Record<StatTone, string> = {
  amber:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/20",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20",
  slate:
    "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300 border-slate-200/70 dark:border-slate-500/20",
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  isLoading: boolean;
  tone: StatTone;
  active: boolean;
  onClick: () => void;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  isLoading,
  tone,
  active,
  onClick,
}: StatCardProps) => (
  <Card
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    aria-pressed={active}
    aria-label={`Lọc theo: ${label}`}
    className={cn(
      "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active && "ring-2 ring-primary",
    )}
  >
    <CardContent className="flex items-center gap-4 p-5">
      <div className={`rounded-lg border p-3 ${TONE_CLASS[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        {isLoading ? (
          <Skeleton className="mt-1 h-7 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </div>
    </CardContent>
  </Card>
);

const AdminDoctorApplicationsPage = () => {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [searchParam, setSearchParam] = useSearchParams();
  const currentStatus = searchParam.get("status") ?? "all";

  const baseQuery = { page: 1, limit: 1 };
  const pendingQ = useAdminListDoctorRequest({
    ...baseQuery,
    status: RegistrationStatusName.Pending,
  });
  const approvedQ = useAdminListDoctorRequest({
    ...baseQuery,
    status: RegistrationStatusName.Approved,
  });
  const rejectedQ = useAdminListDoctorRequest({
    ...baseQuery,
    status: RegistrationStatusName.Rejected,
  });
  const suspendedQ = useAdminListDoctorRequest({
    ...baseQuery,
    status: RegistrationStatusName.Suspended,
  });

  const counts = {
    pending: pendingQ.data?.data.meta.totalItems ?? 0,
    approved: approvedQ.data?.data.meta.totalItems ?? 0,
    rejected: rejectedQ.data?.data.meta.totalItems ?? 0,
    suspended: suspendedQ.data?.data.meta.totalItems ?? 0,
  };

  const handleFilterByStatus = (status: RegistrationStatusNameType) => {
    const next = new URLSearchParams(searchParam);
    if (currentStatus === status) {
      next.delete("status");
    } else {
      next.set("status", status);
    }
    next.delete("page");
    setSearchParam(next, { replace: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge
          variant="outline"
          className="mb-2"
        >
          <Stethoscope className="h-3 w-3" />
          Cổng quản trị
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">
          Đơn xin làm bác sĩ
        </h1>
        <p className="text-sm text-muted-foreground">
          Xét duyệt, từ chối hoặc tạm ngưng các yêu cầu trở thành bác sĩ trên
          nền tảng.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Chờ duyệt"
          value={counts.pending}
          isLoading={pendingQ.isLoading}
          tone="amber"
          active={currentStatus === RegistrationStatusName.Pending}
          onClick={() => handleFilterByStatus(RegistrationStatusName.Pending)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã duyệt"
          value={counts.approved}
          isLoading={approvedQ.isLoading}
          tone="emerald"
          active={currentStatus === RegistrationStatusName.Approved}
          onClick={() => handleFilterByStatus(RegistrationStatusName.Approved)}
        />
        <StatCard
          icon={XCircle}
          label="Đã từ chối"
          value={counts.rejected}
          isLoading={rejectedQ.isLoading}
          tone="rose"
          active={currentStatus === RegistrationStatusName.Rejected}
          onClick={() => handleFilterByStatus(RegistrationStatusName.Rejected)}
        />
        <StatCard
          icon={PauseCircle}
          label="Tạm ngưng"
          value={counts.suspended}
          isLoading={suspendedQ.isLoading}
          tone="slate"
          active={currentStatus === RegistrationStatusName.Suspended}
          onClick={() => handleFilterByStatus(RegistrationStatusName.Suspended)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn đăng ký</CardTitle>
          <CardDescription>
            Nhấn vào một đơn để xem hồ sơ chuyên môn và đưa ra quyết định.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorApplicationsTable onViewDetail={(id) => setSelectedId(id)} />
        </CardContent>
      </Card>

      <DoctorApplicationDetailDialog
        id={selectedId}
        onClose={() => setSelectedId(undefined)}
      />
    </div>
  );
};

export default AdminDoctorApplicationsPage;
