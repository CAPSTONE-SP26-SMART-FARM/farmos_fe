import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import type { UpdateDoctorRequestStatusBodyType } from "@/schemaValidatation/doctorProfile";

export type DecisionStatus = UpdateDoctorRequestStatusBodyType["status"];

type ActionTone = "positive" | "destructive" | "warning";

interface ActionConfig {
  requiresReason: boolean;
  buttonVariant: "default" | "destructive" | "outline";
  buttonClassName?: string;
  confirmVariant: "default" | "destructive";
  confirmTitle: string;
  confirmDescription: string;
  reasonDescription: string;
  reasonPlaceholder: string;
  icon: LucideIcon;
  shortDescription: string;
  tone: ActionTone;
}

const ACTION_CONFIG: Record<DecisionStatus, ActionConfig> = {
  [RegistrationStatusName.Approved]: {
    requiresReason: false,
    buttonVariant: "default",
    buttonClassName: "bg-emerald-600 text-white hover:bg-emerald-600/90",
    confirmVariant: "default",
    confirmTitle: "Xác nhận duyệt đơn?",
    confirmDescription:
      "Người dùng sẽ được cấp quyền bác sĩ và nhận thông báo. Có thể tạm ngưng sau nếu cần.",
    reasonDescription: "",
    reasonPlaceholder: "",
    icon: CheckCircle2,
    shortDescription:
      "Cấp quyền bác sĩ cho người dùng và gửi thông báo xác nhận.",
    tone: "positive",
  },
  [RegistrationStatusName.Rejected]: {
    requiresReason: true,
    buttonVariant: "destructive",
    confirmVariant: "destructive",
    confirmTitle: "Xác nhận từ chối đơn?",
    confirmDescription:
      "Đơn sẽ bị từ chối và lý do sẽ được gửi tới người dùng.",
    reasonDescription:
      "Vui lòng ghi rõ lý do từ chối để người dùng biết cần bổ sung gì.",
    reasonPlaceholder: "Ví dụ: Giấy phép hành nghề đã hết hạn...",
    icon: XCircle,
    shortDescription: "Từ chối hồ sơ và gửi lý do tới người dùng.",
    tone: "destructive",
  },
  [RegistrationStatusName.Suspended]: {
    requiresReason: true,
    buttonVariant: "outline",
    confirmVariant: "destructive",
    confirmTitle: "Xác nhận tạm ngưng?",
    confirmDescription:
      "Người dùng sẽ không thể tiếp tục hoạt động dưới vai trò bác sĩ cho tới khi được khôi phục.",
    reasonDescription: "Ghi rõ lý do tạm ngưng để người dùng nắm được.",
    reasonPlaceholder: "Ví dụ: Vi phạm quy định tư vấn...",
    icon: PauseCircle,
    shortDescription:
      "Tạm khóa quyền bác sĩ, có thể khôi phục lại bất cứ lúc nào.",
    tone: "warning",
  },
};

const TONE_CARD_CLASS: Record<ActionTone, string> = {
  positive:
    "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10",
  destructive:
    "border-rose-200 hover:border-rose-400 hover:bg-rose-50/60 dark:border-rose-500/30 dark:hover:bg-rose-500/10",
  warning:
    "border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 dark:border-amber-500/30 dark:hover:bg-amber-500/10",
};

const TONE_ICON_CLASS: Record<ActionTone, string> = {
  positive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  destructive:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const ALLOWED_TRANSITIONS: Record<
  RegistrationStatusNameType,
  DecisionStatus[]
> = {
  [RegistrationStatusName.Pending]: [
    RegistrationStatusName.Approved,
    RegistrationStatusName.Rejected,
  ],
  [RegistrationStatusName.Approved]: [RegistrationStatusName.Suspended],
  [RegistrationStatusName.Rejected]: [RegistrationStatusName.Approved],
  [RegistrationStatusName.Suspended]: [RegistrationStatusName.Approved],
};

export const getDecisionLabel = (
  target: DecisionStatus,
  current: RegistrationStatusNameType,
): string => {
  if (target === RegistrationStatusName.Approved) {
    if (current === RegistrationStatusName.Pending) return "Duyệt đơn";
    if (current === RegistrationStatusName.Suspended)
      return "Cho phép hoạt động lại";
    if (current === RegistrationStatusName.Rejected) return "Duyệt lại đơn";
    return "Cho phép hoạt động";
  }
  if (target === RegistrationStatusName.Rejected) return "Từ chối đơn";
  if (target === RegistrationStatusName.Suspended)
    return "Tạm ngưng hoạt động";
  return "";
};

export const getAllowedTransitions = (
  current: RegistrationStatusNameType,
): DecisionStatus[] => ALLOWED_TRANSITIONS[current] ?? [];

interface DecisionFlowProps {
  isPending: boolean;
  currentStatus: RegistrationStatusNameType;
  onAction: (status: DecisionStatus, reason: string) => void;
  renderTrigger: (pick: (status: DecisionStatus) => void) => React.ReactNode;
}

export const DecisionFlow = ({
  isPending,
  currentStatus,
  onAction,
  renderTrigger,
}: DecisionFlowProps) => {
  const [selected, setSelected] = useState<DecisionStatus | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();
  const [stage, setStage] = useState<"reason" | "confirm" | null>(null);

  const handlePick = (status: DecisionStatus) => {
    setSelected(status);
    setReasonInput("");
    setLocalError(undefined);
    setStage(ACTION_CONFIG[status].requiresReason ? "reason" : "confirm");
  };

  const closeAll = () => {
    setStage(null);
    setSelected(null);
    setReasonInput("");
    setLocalError(undefined);
  };

  const handleReasonContinue = () => {
    if (!reasonInput.trim()) {
      setLocalError("Vui lòng nhập lý do trước khi tiếp tục");
      return;
    }
    setLocalError(undefined);
    setStage("confirm");
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAction(selected, reasonInput.trim());
    closeAll();
  };

  const cfg = selected ? ACTION_CONFIG[selected] : null;
  const label = selected ? getDecisionLabel(selected, currentStatus) : "";

  return (
    <>
      {renderTrigger(handlePick)}

      <Dialog
        open={stage === "reason"}
        onOpenChange={(o) => !o && closeAll()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            {cfg?.reasonDescription && (
              <DialogDescription>{cfg.reasonDescription}</DialogDescription>
            )}
          </DialogHeader>
          <Field data-invalid={!!localError}>
            <FieldLabel>
              Lý do <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              value={reasonInput}
              onChange={(e) => {
                setReasonInput(e.target.value);
                if (localError) setLocalError(undefined);
              }}
              placeholder={cfg?.reasonPlaceholder}
              rows={4}
              autoFocus
            />
            {localError && (
              <FieldError errors={[{ message: localError }]} />
            )}
          </Field>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeAll}
            >
              Quay lại
            </Button>
            <Button
              type="button"
              variant={
                cfg?.confirmVariant === "destructive" ? "destructive" : "default"
              }
              disabled={isPending}
              onClick={handleReasonContinue}
            >
              Tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {stage === "confirm" && cfg && (
        <ConfirmDialog
          open
          title={cfg.confirmTitle}
          description={cfg.confirmDescription}
          variant={cfg.confirmVariant}
          confirmLabel={isPending ? "Đang xử lý..." : label}
          cancelLabel="Quay lại"
          onConfirm={handleConfirm}
          onCancel={closeAll}
        />
      )}
    </>
  );
};

interface DecisionButtonsProps {
  isPending: boolean;
  currentStatus: RegistrationStatusNameType;
  onAction: (status: DecisionStatus, reason: string) => void;
}

export const DecisionButtons = ({
  isPending,
  currentStatus,
  onAction,
}: DecisionButtonsProps) => {
  const allowed = getAllowedTransitions(currentStatus);

  return (
    <DecisionFlow
      isPending={isPending}
      currentStatus={currentStatus}
      onAction={onAction}
      renderTrigger={(pick) => (
        <div className="flex flex-wrap gap-2">
          {allowed.map((status) => {
            const cfg = ACTION_CONFIG[status];
            return (
              <Button
                key={status}
                type="button"
                variant={cfg.buttonVariant}
                className={cfg.buttonClassName}
                disabled={isPending}
                onClick={() => pick(status)}
              >
                {getDecisionLabel(status, currentStatus)}
              </Button>
            );
          })}
        </div>
      )}
    />
  );
};

export const DecisionActionCards = ({
  isPending,
  currentStatus,
  onAction,
}: DecisionButtonsProps) => {
  const allowed = getAllowedTransitions(currentStatus);

  return (
    <DecisionFlow
      isPending={isPending}
      currentStatus={currentStatus}
      onAction={onAction}
      renderTrigger={(pick) => (
        <div className="grid gap-2.5">
          {allowed.map((status) => {
            const cfg = ACTION_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <button
                key={status}
                type="button"
                disabled={isPending}
                onClick={() => pick(status)}
                aria-label={getDecisionLabel(status, currentStatus)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  TONE_CARD_CLASS[cfg.tone],
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                    TONE_ICON_CLASS[cfg.tone],
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">
                    {getDecisionLabel(status, currentStatus)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {cfg.shortDescription}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}
    />
  );
};
