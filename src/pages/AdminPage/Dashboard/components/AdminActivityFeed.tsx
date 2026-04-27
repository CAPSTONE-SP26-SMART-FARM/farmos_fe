import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTimeVi, parseBackendDate } from "@/lib/format";
import EmptyState from "@/components/common/EmptyState";
import type {
  ActivityType,
  AdminActivityItem,
} from "../_mocks/adminDashboard.mock";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Activity,
  Building2,
  CircleDollarSign,
  Stethoscope,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const TYPE_META: Record<
  ActivityType,
  { icon: LucideIcon; tone: string }
> = {
  "user-signup": {
    icon: UserPlus,
    tone: "bg-blue-500/10 text-blue-600",
  },
  "farm-created": {
    icon: Building2,
    tone: "bg-emerald-500/10 text-emerald-600",
  },
  "payment-received": {
    icon: CircleDollarSign,
    tone: "bg-emerald-500/10 text-emerald-600",
  },
  "doctor-approved": {
    icon: Stethoscope,
    tone: "bg-violet-500/10 text-violet-600",
  },
  "subscription-cancelled": {
    icon: XCircle,
    tone: "bg-red-500/10 text-red-600",
  },
};

function relativeVi(value: string): string {
  const d = parseBackendDate(value);
  if (!d) return "-";
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
    return formatDateTimeVi(value);
  }
}

interface AdminActivityFeedProps {
  items: AdminActivityItem[];
  maxItems?: number;
  className?: string;
}

function AdminActivityFeed({
  items,
  maxItems,
  className,
}: AdminActivityFeedProps) {
  const visible = maxItems ? items.slice(0, maxItems) : items;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        <CardDescription>
          Các sự kiện mới nhất trên toàn nền tảng.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Chưa có hoạt động"
            description="Sự kiện mới sẽ xuất hiện ở đây."
          />
        ) : (
          <ul
            className="space-y-4"
            aria-label="Danh sách hoạt động"
          >
            {visible.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <li
                  key={item.id}
                  className="flex gap-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      meta.tone,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      <time
                        dateTime={item.createdAt}
                        title={formatDateTimeVi(item.createdAt)}
                        className="shrink-0 text-[11px] text-muted-foreground"
                      >
                        {relativeVi(item.createdAt)}
                      </time>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminActivityFeed;
