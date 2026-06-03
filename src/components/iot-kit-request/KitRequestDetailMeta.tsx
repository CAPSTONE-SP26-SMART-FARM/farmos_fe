import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DEVICE_STATUS_LABEL_ADMIN } from "@/constants/iotDeviceDisplay";
import {
  KitRequestBoardOutcomeBadge,
  KitRequestInstallReasonBadge,
  KitRequestRecoveryReasonBadge,
  KitRequestStatusBadge,
  KitRequestTypeBadge,
} from "./KitRequestBadges";
import type {
  KitRequestContactType,
  KitRequestDetailResType,
  KitRequestDeviceType,
  KitRequestResType,
} from "@/schemaValidatation/iotKitRequest";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Building2, MapPin, Phone, UserRound } from "lucide-react";

/**
 * Khối thông tin chi tiết readonly chia sẻ giữa owner dialog và admin dialog.
 * Hiển thị: badges + tiêu đề + mô tả + timeline + SLA deadline + devices.
 *
 * Khi truyền vào `KitRequestDetailResType` (có `devices[]`) → render
 * device summary chip. Khi chỉ có `KitRequestResType` → bỏ qua.
 */

type RequestLike = KitRequestResType | KitRequestDetailResType;

/**
 * `section` prop cho phép parent (vd admin dialog với tab layout) render riêng
 * phần info hoặc devices. Mặc định "all" giữ behavior cũ — owner dialog không
 * cần đổi.
 */
export function KitRequestDetailMeta({
  request,
  section = "all",
}: {
  request: RequestLike;
  section?: "all" | "info" | "devices";
}) {
  const devices =
    "devices" in request ? request.devices : null;
  // Khối liên hệ chỉ có khi admin xem (BE gate theo role). Hiện khi có ít nhất
  // 1 thông tin để hiển thị.
  const contact =
    "contact" in request ? (request.contact ?? null) : null;
  const isInstallSchedule = request.type === "INSTALL_SCHEDULE";
  const isRecoverySchedule = request.type === "RECOVERY_SCHEDULE";
  const isFaultReport = request.type === "FAULT_REPORT";
  const showInstallRecoveryDevices =
    (isInstallSchedule || isRecoverySchedule) && devices;
  const showInfo = section === "all" || section === "info";
  const showDevices = section === "all" || section === "devices";

  const faultyDevice =
    isFaultReport && devices && request.iotDeviceId
      ? devices.find((d) => d.id === request.iotDeviceId) ?? null
      : null;
  const replacementDeviceId = request.metadata?.replacementDeviceId;
  const replacementDevice =
    isFaultReport && devices && replacementDeviceId
      ? devices.find((d) => d.id === replacementDeviceId) ?? null
      : null;
  const oldBoardOutcome = request.metadata?.oldBoardOutcome;
  const installReason = request.metadata?.installReason;
  const recoveryReason = request.metadata?.recoveryReason;
  const boardOutcomeOnComplete = request.metadata?.boardOutcomeOnComplete;

  // Section "devices" only → render gọn không separator/header trùng
  if (section === "devices") {
    if (showInstallRecoveryDevices) {
      return (
        <div className="text-sm">
          <DevicesSection
            devices={devices}
            kind={isRecoverySchedule ? "recovery" : "install"}
            installReason={isInstallSchedule ? installReason : undefined}
            recoveryReason={isRecoverySchedule ? recoveryReason : undefined}
            boardOutcomeOnComplete={
              isRecoverySchedule ? boardOutcomeOnComplete : undefined
            }
          />
        </div>
      );
    }
    if (isFaultReport) {
      return (
        <div className="text-sm">
          <FaultDeviceSection
            faultyDevice={faultyDevice}
            replacementDevice={replacementDevice}
            scheduledAt={request.scheduledAt}
            oldBoardOutcome={oldBoardOutcome}
          />
        </div>
      );
    }
    return (
      <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Yêu cầu này không gắn thiết bị nào.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {showInfo && (
        <>
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

          {contact && <ContactSection contact={contact} />}

          <Separator />
        </>
      )}

      {showDevices && showInstallRecoveryDevices && (
        <>
          <DevicesSection
            devices={devices}
            kind={isRecoverySchedule ? "recovery" : "install"}
            installReason={isInstallSchedule ? installReason : undefined}
            recoveryReason={isRecoverySchedule ? recoveryReason : undefined}
            boardOutcomeOnComplete={
              isRecoverySchedule ? boardOutcomeOnComplete : undefined
            }
          />
          <Separator />
        </>
      )}

      {showDevices && isFaultReport && (
        <>
          <FaultDeviceSection
            faultyDevice={faultyDevice}
            replacementDevice={replacementDevice}
            scheduledAt={request.scheduledAt}
            oldBoardOutcome={oldBoardOutcome}
          />
          <Separator />
        </>
      )}

      {showInfo && (
        <>
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
        </>
      )}
    </div>
  );
}

/**
 * Khối thông tin liên hệ — chỉ render trong dialog admin (BE chỉ trả `contact`
 * cho role admin). Mỗi dòng tự ẩn khi thiếu dữ liệu; nếu không có gì để hiện
 * thì bỏ luôn cả khối.
 */
function ContactSection({ contact }: { contact: KitRequestContactType }) {
  const hasFarm = !!(contact.farmName || contact.farmAddress);
  const hasOwner = !!(contact.ownerName || contact.ownerPhone);
  const hasManager = !!(contact.managerName || contact.managerPhone);
  if (!hasFarm && !hasOwner && !hasManager) return null;

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Thông tin liên hệ
      </p>

      {hasFarm && (
        <div className="flex items-start gap-2">
          <Building2
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium leading-snug">
              {contact.farmName ?? "Chưa có tên trang trại"}
            </p>
            {contact.farmAddress && (
              <p className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{contact.farmAddress}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {hasOwner && (
        <ContactPerson
          roleLabel="Chủ trang trại"
          name={contact.ownerName}
          phone={contact.ownerPhone}
        />
      )}

      {hasManager && (
        <ContactPerson
          roleLabel={
            contact.zoneName
              ? `Quản lý vùng · ${contact.zoneName}`
              : "Quản lý vùng"
          }
          name={contact.managerName}
          phone={contact.managerPhone}
        />
      )}
    </div>
  );
}

function ContactPerson({
  roleLabel,
  name,
  phone,
}: {
  roleLabel: string;
  name: string | null;
  phone: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <UserRound
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
        <p className="font-medium leading-snug">{name ?? "Chưa có tên"}</p>
        <p className="flex items-center gap-1 text-sm">
          <Phone aria-hidden="true" className="h-3 w-3 shrink-0" />
          {phone ? (
            <span>{phone}</span>
          ) : (
            <span className="text-muted-foreground">Chưa có số điện thoại</span>
          )}
        </p>
      </div>
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
        <span className="text-muted-foreground">Hạn lắp đặt: </span>
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
        {isOverdue ? "Quá hạn lắp đặt" : "Trong hạn lắp đặt"}
      </Badge>
      <span className="text-muted-foreground">
        Hạn lắp đặt: {format(deadline, "dd/MM/yyyy HH:mm", { locale: vi })}
      </span>
      <span className="text-xs text-muted-foreground">({distance})</span>
    </div>
  );
}

const OLD_BOARD_OUTCOME_LABEL: Record<"revoked" | "available", string> = {
  revoked: "Đã thu hồi",
  available: "Trả về kho",
};

function FaultDeviceSection({
  faultyDevice,
  replacementDevice,
  scheduledAt,
  oldBoardOutcome,
}: {
  faultyDevice: KitRequestDeviceType | null;
  replacementDevice: KitRequestDeviceType | null;
  scheduledAt: string | null | undefined;
  oldBoardOutcome: "revoked" | "available" | undefined;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Thiết bị báo lỗi
        </p>
        {faultyDevice ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-destructive/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">
                {faultyDevice.label ?? faultyDevice.deviceName}
              </span>
              {faultyDevice.label && (
                <span className="text-xs text-muted-foreground">
                  · {faultyDevice.deviceName}
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {DEVICE_STATUS_LABEL_ADMIN[faultyDevice.status] ??
                faultyDevice.status}
            </Badge>
          </div>
        ) : (
          <p className="rounded-md border bg-muted/30 p-2 text-sm text-muted-foreground">
            Không xác định được thiết bị (có thể đã bị xóa).
          </p>
        )}
      </div>

      {(scheduledAt || replacementDevice) && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Lịch thay thiết bị
          </p>
          <div className="space-y-2 rounded-md border bg-muted/20 p-3 text-sm">
            {scheduledAt && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Thời gian hẹn:</span>
                <span className="font-medium">
                  {format(new Date(scheduledAt), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
            {replacementDevice ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Bộ kit thay thế:</span>
                  <span className="font-mono font-medium">
                    {replacementDevice.label ?? replacementDevice.deviceName}
                  </span>
                  {replacementDevice.label && (
                    <span className="text-xs text-muted-foreground">
                      · {replacementDevice.deviceName}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {DEVICE_STATUS_LABEL_ADMIN[replacementDevice.status] ??
                    replacementDevice.status}
                </Badge>
              </div>
            ) : (
              scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  Chưa gán bộ kit thay thế cụ thể.
                </p>
              )
            )}
            {oldBoardOutcome && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Tình trạng bộ kit cũ:</span>
                <Badge variant="outline" className="text-xs">
                  {OLD_BOARD_OUTCOME_LABEL[oldBoardOutcome]}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DevicesSection({
  devices,
  kind,
  installReason,
  recoveryReason,
  boardOutcomeOnComplete,
}: {
  devices: NonNullable<KitRequestDetailResType["devices"]>;
  kind: "install" | "recovery";
  installReason?: "crop_approved" | "milestone_started";
  recoveryReason?:
    | "milestone_transition"
    | "cropseason_completed"
    | "subscription_ended";
  boardOutcomeOnComplete?: "purchase" | "available";
}) {
  const heading =
    kind === "recovery"
      ? "Thiết bị cần thu hồi"
      : "Thiết bị thuộc yêu cầu";

  // Derive milestone order chung từ devices (sau M1 fix, mọi device 1 request
  // thuộc cùng milestone). Hiện "Giai đoạn N" — KHÔNG hiện UUID.
  const milestoneOrders = Array.from(
    new Set(
      devices
        .map((d) => d.milestoneOrder)
        .filter((o): o is number => o !== null && o !== undefined),
    ),
  ).sort((a, b) => a - b);
  const milestoneLabel =
    kind === "install" && milestoneOrders.length === 1
      ? `Giai đoạn ${milestoneOrders[0]}`
      : null;
  const emptyMessage =
    kind === "recovery"
      ? "Không còn thiết bị nào cần thu hồi — có thể đã thu xong hoặc owner không còn thiết bị nào."
      : "Không còn thiết bị nào thuộc yêu cầu này (có thể đã hoàn tất hoặc bị gỡ phân bổ).";

  if (devices.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        {emptyMessage}
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
          {heading} ({devices.length})
        </p>
        {milestoneLabel && (
          <Badge variant="secondary" className="text-xs">
            {milestoneLabel}
          </Badge>
        )}
        {installReason && (
          <KitRequestInstallReasonBadge
            reason={installReason}
            className="text-xs"
          />
        )}
        {recoveryReason && (
          <KitRequestRecoveryReasonBadge
            reason={recoveryReason}
            className="text-xs"
          />
        )}
        {boardOutcomeOnComplete && (
          <KitRequestBoardOutcomeBadge
            outcome={boardOutcomeOnComplete}
            className="text-xs"
          />
        )}
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
