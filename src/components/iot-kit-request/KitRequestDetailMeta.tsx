import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import {
  KitRequestStatusBadge,
  KitRequestTypeBadge,
} from "./KitRequestBadges";
import type {
  KitRequestDetailResType,
  KitRequestResType,
} from "@/schemaValidatation/iotKitRequest";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Khối thông tin chi tiết readonly chia sẻ giữa owner dialog và admin dialog.
 * Hiển thị: badges + tiêu đề + mô tả + timeline + SLA deadline + devices.
 *
 * Khi truyền vào `KitRequestDetailResType` (có `devices[]`) → render
 * device summary chip. Khi chỉ có `KitRequestResType` → bỏ qua.
 */

type RequestLike = KitRequestResType | KitRequestDetailResType;

const formatDateTime = (iso: string | null | undefined): string =>
  iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";

export function KitRequestDetailMeta({ request }: { request: RequestLike }) {
  const devices =
    "devices" in request ? request.devices : null;
  const isInstallSchedule = request.type === "INSTALL_SCHEDULE";

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <KitRequestStatusBadge status={request.status} />
        <KitRequestTypeBadge type={request.type} />
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {request.requestNumber}
        </span>
      </div>

      {/* SLA badge — chỉ INSTALL_SCHEDULE */}
      {isInstallSchedule && request.slaDeadline && (
        <SlaBadge slaDeadline={request.slaDeadline} status={request.status} />
      )}

      <Separator />

      <div className="space-y-2">
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Tiêu đề
          </p>
          <p className="font-medium leading-snug">{request.title}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Mô tả
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {request.description}
          </p>
        </div>
      </div>

      <Separator />

      {/* Devices preview — chỉ INSTALL_SCHEDULE và có data */}
      {isInstallSchedule && devices && (
        <>
          <DevicesSection devices={devices} />
          <Separator />
        </>
      )}

      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        <MetaRow label="Tạo lúc" value={formatDateTime(request.createdAt)} />
        <MetaRow label="Cập nhật" value={formatDateTime(request.updatedAt)} />
        {request.completedAt && (
          <MetaRow
            label="Hoàn tất lắp"
            value={formatDateTime(request.completedAt)}
          />
        )}
        {request.resolvedAt && (
          <MetaRow
            label="Đóng yêu cầu"
            value={formatDateTime(request.resolvedAt)}
          />
        )}
        {request.cancelledAt && (
          <MetaRow
            label="Hủy yêu cầu"
            value={formatDateTime(request.cancelledAt)}
          />
        )}
      </div>

      {request.resolutionNote && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Ghi chú xử lý từ quản trị
            </p>
            <p className="rounded-md border bg-muted/30 p-2 text-sm leading-relaxed">
              {request.resolutionNote}
            </p>
          </div>
        </>
      )}

      {request.cancelReason && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Lý do hủy / từ chối
            </p>
            <p className="rounded-md border bg-muted/30 p-2 text-sm leading-relaxed">
              {request.cancelReason}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SlaBadge({
  slaDeadline,
  status,
}: {
  slaDeadline: string;
  status: KitRequestResType["status"];
}) {
  const deadline = new Date(slaDeadline);
  const now = Date.now();
  const isTerminal = ["resolved", "rejected", "cancelled"].includes(status);
  const isOverdue = !isTerminal && deadline.getTime() < now;

  // Hiển thị "trong N ngày nữa" hoặc "quá hạn N ngày"
  const distance = formatDistanceToNow(deadline, { locale: vi, addSuffix: true });

  if (isTerminal) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <span className="text-muted-foreground">SLA: </span>
        <span className="font-medium">
          {format(deadline, "dd/MM/yyyy HH:mm", { locale: vi })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={
        "flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm " +
        (isOverdue
          ? "border-destructive/40 bg-destructive/5"
          : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20")
      }
    >
      <Badge variant={isOverdue ? "destructive" : "default"}>
        {isOverdue ? "Quá hạn SLA" : "Trong SLA"}
      </Badge>
      <span className="text-muted-foreground">
        Hạn lắp đặt: {format(deadline, "dd/MM/yyyy HH:mm", { locale: vi })}
      </span>
      <span className="text-xs text-muted-foreground">({distance})</span>
    </div>
  );
}

function DevicesSection({
  devices,
}: {
  devices: NonNullable<KitRequestDetailResType["devices"]>;
}) {
  if (devices.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Không còn thiết bị nào thuộc yêu cầu này (có thể đã hoàn tất hoặc bị
        gỡ phân bổ).
      </div>
    );
  }

  // Đếm theo status để show summary
  const statusCount = devices.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Thiết bị thuộc yêu cầu ({devices.length})
        </p>
        {Object.entries(statusCount).map(([status, count]) => (
          <Badge
            key={status}
            variant="outline"
            className="text-xs"
          >
            {DEVICE_STATUS_LABEL_ADMIN[
              status as keyof typeof DEVICE_STATUS_LABEL_ADMIN
            ] ?? status}
            : {count}
          </Badge>
        ))}
      </div>
      <ul className="space-y-1 rounded-md border bg-muted/20 p-2 text-sm">
        {devices.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded px-2 py-1 hover:bg-background"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">
                {d.label ?? d.deviceName}
              </span>
              {d.zoneName && (
                <span className="text-xs text-muted-foreground">
                  · {d.zoneName}
                </span>
              )}
            </div>
            <Badge
              variant="outline"
              className="text-xs"
            >
              {DEVICE_STATUS_LABEL_ADMIN[d.status] ?? d.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
