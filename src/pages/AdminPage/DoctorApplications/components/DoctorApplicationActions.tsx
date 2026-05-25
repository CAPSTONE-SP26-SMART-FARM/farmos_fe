import { useState } from "react";

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
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import type { UpdateDoctorRequestStatusBodyType } from "@/schemaValidatation/doctorProfile";

export type DecisionStatus = UpdateDoctorRequestStatusBodyType["status"];

interface ActionConfig {
  requiresReason: boolean;
  buttonVariant: "default" | "destructive" | "outline";
  buttonClassName?: string;
  confirmVariant: "default" | "destructive";
  confirmTitle: string;
  confirmDescription: string;
  reasonDescription: string;
  reasonPlaceholder: string;
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
  },
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
