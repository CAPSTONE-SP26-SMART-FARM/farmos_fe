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
import { parseBackendDate } from "./helpers";
import { DatePickerField } from "./milestoneFormHelpers";

export type MilestoneEditFormState = {
  stageName: string;
  milestoneOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
};

type MilestoneEditFormErrors = Partial<
  Record<keyof MilestoneEditFormState, string>
>;

const validate = (
  values: MilestoneEditFormState,
): MilestoneEditFormErrors => {
  const errors: MilestoneEditFormErrors = {};

  if (!values.stageName.trim()) {
    errors.stageName = "Tên giai đoạn là bắt buộc.";
  }

  const start = parseBackendDate(values.expectedStartDate);
  const end = parseBackendDate(values.expectedEndDate);

  if (values.expectedStartDate && !start) {
    errors.expectedStartDate = "Ngày bắt đầu dự kiến không hợp lệ.";
  }
  if (values.expectedEndDate && !end) {
    errors.expectedEndDate = "Ngày kết thúc dự kiến không hợp lệ.";
  }
  if (start && end && !isAfter(startOfDay(end), startOfDay(start))) {
    errors.expectedEndDate =
      "Ngày kết thúc dự kiến phải sau ngày bắt đầu dự kiến.";
  }

  return errors;
};

export const MilestoneEditDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isSubmitting,
  minExpectedStartDate,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MilestoneEditFormState) => void;
  initialValues: MilestoneEditFormState;
  isSubmitting: boolean;
  minExpectedStartDate?: Date;
}) => {
  const [form, setForm] = useState<MilestoneEditFormState>(initialValues);
  const [errors, setErrors] = useState<MilestoneEditFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm(initialValues);
    setErrors({});
  }, [open, initialValues]);

  const update = <K extends keyof MilestoneEditFormState>(
    key: K,
    value: MilestoneEditFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(form);
  };

  const parsedStart = parseBackendDate(form.expectedStartDate);
  const normalizedMin = minExpectedStartDate
    ? startOfDay(minExpectedStartDate)
    : undefined;
  const minEnd = parsedStart
    ? addDays(startOfDay(parsedStart), 1)
    : normalizedMin
      ? addDays(normalizedMin, 1)
      : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa mốc</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium">Tên giai đoạn *</label>
            <Input
              className="mt-1"
              placeholder="Ví dụ: Nảy mầm"
              value={form.stageName}
              onChange={(e) => update("stageName", e.target.value)}
            />
            {errors.stageName && (
              <p className="text-xs text-destructive mt-1">
                {errors.stageName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DatePickerField
              label="Ngày bắt đầu dự kiến"
              placeholder="Chọn ngày bắt đầu"
              value={form.expectedStartDate}
              error={errors.expectedStartDate}
              onChange={(value) => update("expectedStartDate", value)}
              minDate={normalizedMin}
            />
            <DatePickerField
              label="Ngày kết thúc dự kiến"
              placeholder="Chọn ngày kết thúc"
              value={form.expectedEndDate}
              error={errors.expectedEndDate}
              onChange={(value) => update("expectedEndDate", value)}
              minDate={minEnd}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
