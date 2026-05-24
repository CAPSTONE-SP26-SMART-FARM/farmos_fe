import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { addDays, isAfter, startOfDay } from "date-fns";
import { useManagerCreateProductionMilestone } from "@/queries/useProductionMilestone";
import { parseBackendDate } from "./helpers";
import { DatePickerField } from "./milestoneFormHelpers";

type FormState = {
  stageName: string;
  expectedStartDate: string;
  expectedEndDate: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  stageName: "",
  expectedStartDate: "",
  expectedEndDate: "",
};

export function MilestoneCreateDialog({
  open,
  onOpenChange,
  cropSeasonId,
  nextMilestoneOrder,
  lastExistingEndDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cropSeasonId: string;
  nextMilestoneOrder: number;
  lastExistingEndDate?: string | null;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setErrors({});
  }, [open]);

  const createMutation = useManagerCreateProductionMilestone(cropSeasonId);

  const parsedPrevEnd = parseBackendDate(lastExistingEndDate ?? undefined);
  const minStart = parsedPrevEnd
    ? addDays(startOfDay(parsedPrevEnd), 1)
    : undefined;

  const parsedStart = parseBackendDate(form.expectedStartDate);
  const minEnd = parsedStart
    ? addDays(startOfDay(parsedStart), 1)
    : minStart
      ? addDays(minStart, 1)
      : undefined;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.stageName.trim()) {
      next.stageName = "Tên giai đoạn là bắt buộc.";
    }
    if (!form.expectedStartDate) {
      next.expectedStartDate = "Ngày bắt đầu là bắt buộc.";
    }
    if (!form.expectedEndDate) {
      next.expectedEndDate = "Ngày kết thúc là bắt buộc.";
    }
    const start = parseBackendDate(form.expectedStartDate);
    const end = parseBackendDate(form.expectedEndDate);
    if (start && end && !isAfter(startOfDay(end), startOfDay(start))) {
      next.expectedEndDate = "Ngày kết thúc phải sau ngày bắt đầu.";
    }
    if (start && minStart && startOfDay(start).getTime() < minStart.getTime()) {
      next.expectedStartDate = "Ngày bắt đầu phải sau mốc trước đó.";
    }
    return next;
  };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    createMutation.mutate(
      {
        stageName: form.stageName.trim(),
        milestoneOrder: nextMilestoneOrder,
        expectedStartDate: form.expectedStartDate,
        expectedEndDate: form.expectedEndDate,
        status: "pending",
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo mốc mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Mốc sẽ được thêm vào vị trí #{nextMilestoneOrder} (cuối danh sách).
          </div>

          <div>
            <label className="text-sm font-medium">Tên giai đoạn *</label>
            <Input
              className="mt-1"
              placeholder="Ví dụ: Nảy mầm"
              value={form.stageName}
              onChange={(e) => update("stageName", e.target.value)}
            />
            {errors.stageName && (
              <p className="text-xs text-destructive mt-1">{errors.stageName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DatePickerField
              label="Ngày bắt đầu *"
              placeholder="Chọn ngày bắt đầu"
              value={form.expectedStartDate}
              error={errors.expectedStartDate}
              onChange={(value) => update("expectedStartDate", value)}
              minDate={minStart}
            />
            <DatePickerField
              label="Ngày kết thúc *"
              placeholder="Chọn ngày kết thúc"
              value={form.expectedEndDate}
              error={errors.expectedEndDate}
              onChange={(value) => update("expectedEndDate", value)}
              minDate={minEnd}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            disabled={createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? "Đang tạo..." : "Tạo mốc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
