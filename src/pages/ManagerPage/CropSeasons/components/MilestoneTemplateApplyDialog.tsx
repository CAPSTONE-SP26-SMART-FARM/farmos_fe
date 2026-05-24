import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { toast } from "sonner";
import { useManagerListMilestoneTemplates } from "@/queries/useMilestoneTemplate";
import { useManagerCreateProductionMilestoneBatch } from "@/queries/useProductionMilestone";
import type { MilestoneTemplateResType } from "@/schemaValidatation/milestoneTemplate";
import { parseBackendDate } from "./helpers";
import { DATE_PAYLOAD_FORMAT, DatePickerField } from "./milestoneFormHelpers";

export function MilestoneTemplateApplyDialog({
  open,
  onOpenChange,
  cropSeasonId,
  nextMilestoneOrder,
  lastExistingEndDate,
  defaultStartDate,
  hasExistingMilestones,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cropSeasonId: string;
  nextMilestoneOrder: number;
  lastExistingEndDate?: string | null;
  defaultStartDate?: string;
  hasExistingMilestones: boolean;
}) {
  const [step, setStep] = useState<"browse" | "preview">("browse");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(defaultStartDate ?? "");
  const [selected, setSelected] = useState<MilestoneTemplateResType | null>(
    null,
  );
  const [confirmAppend, setConfirmAppend] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("browse");
    setSelected(null);
    setSearch("");
    setPage(1);
    setConfirmAppend(false);
    // Mặc định start = ngày sau end của mốc cuối, fallback defaultStartDate.
    const parsedLast = parseBackendDate(lastExistingEndDate ?? undefined);
    if (parsedLast) {
      setStartDate(format(addDays(startOfDay(parsedLast), 1), DATE_PAYLOAD_FORMAT));
    } else {
      setStartDate(defaultStartDate ?? "");
    }
  }, [open, lastExistingEndDate, defaultStartDate]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const templateQuery = useManagerListMilestoneTemplates({
    page,
    limit: 50,
    search: search || undefined,
    type: "crop_season",
  });
  const templates = templateQuery.data?.data.data ?? [];
  const templateMeta = templateQuery.data?.data.meta;

  const createBatchMutation =
    useManagerCreateProductionMilestoneBatch(cropSeasonId);

  const previewItems = useMemo(() => {
    if (!selected) return [];
    const sorted = selected.items
      .slice()
      .sort((a, b) => a.milestoneOrder - b.milestoneOrder);
    const baseStart = parseBackendDate(startDate);
    const normalized = baseStart ? startOfDay(baseStart) : undefined;
    let dayOffset = 0;
    return sorted.map((item, index) => {
      dayOffset += Math.max(item.daysBetween ?? 0, 0);
      const start = normalized
        ? format(addDays(normalized, dayOffset), DATE_PAYLOAD_FORMAT)
        : "";
      // Mặc định 1 ngày cho mỗi stage nếu template không định nghĩa end.
      // Sequence validator của BE chỉ yêu cầu end > start, không yêu cầu
      // gap giữa các stage.
      const end = normalized
        ? format(addDays(normalized, dayOffset + 1), DATE_PAYLOAD_FORMAT)
        : "";
      return {
        index,
        stageName: item.stageName.trim(),
        milestoneOrder: nextMilestoneOrder + index,
        expectedStartDate: start,
        expectedEndDate: end,
        daysBetween: item.daysBetween,
      };
    });
  }, [selected, startDate, nextMilestoneOrder]);

  const handlePickTemplate = (t: MilestoneTemplateResType) => {
    setSelected(t);
    setStep("preview");
  };

  const submitApply = () => {
    if (!selected) return;
    if (previewItems.length === 0) {
      toast.error("Mẫu không có giai đoạn.");
      return;
    }
    if (previewItems.some((p) => !p.expectedStartDate || !p.expectedEndDate)) {
      toast.error("Vui lòng chọn ngày bắt đầu của mẫu.");
      return;
    }
    if (previewItems.some((p) => !p.stageName)) {
      toast.error("Mẫu có tên giai đoạn không hợp lệ.");
      return;
    }

    createBatchMutation.mutate(
      {
        items: previewItems.map((p) => ({
          stageName: p.stageName,
          milestoneOrder: p.milestoneOrder,
          expectedStartDate: p.expectedStartDate,
          expectedEndDate: p.expectedEndDate,
          status: "pending" as const,
        })),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleApplyClick = () => {
    if (hasExistingMilestones) {
      setConfirmAppend(true);
      return;
    }
    submitApply();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {step === "browse" ? "Áp dụng mẫu mốc sản xuất" : "Xem trước mẫu"}
            </DialogTitle>
            <DialogDescription>
              {step === "browse"
                ? "Chọn mẫu để áp vào mùa vụ này. Các mốc từ mẫu sẽ được tạo thêm vào cuối danh sách."
                : `Các mốc bên dưới sẽ được tạo từ vị trí #${nextMilestoneOrder}. Ngày được tính theo "Cách giai đoạn trước" của mẫu.`}
            </DialogDescription>
          </DialogHeader>

          {step === "browse" && (
            <div className="space-y-3 py-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên mẫu"
                className="h-9 text-sm"
              />

              {templateQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Không tìm thấy mẫu.
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handlePickTemplate(t)}
                      className="w-full text-left rounded-md border p-3 hover:bg-muted/50 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.name}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {t.items.length} giai đoạn
                            {t.description ? ` · ${t.description}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Badge>
                      </div>
                      {t.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {t.items
                            .slice()
                            .sort(
                              (a, b) => a.milestoneOrder - b.milestoneOrder,
                            )
                            .slice(0, 4)
                            .map((item) => (
                              <Badge
                                key={`${t.id}-${item.id}`}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                #{item.milestoneOrder} {item.stageName}
                              </Badge>
                            ))}
                          {t.items.length > 4 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{t.items.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  ))}

                  {templateMeta && templateMeta.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Trước
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {page}/{templateMeta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={page >= templateMeta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "preview" && selected && (
            <div className="space-y-3 py-1">
              <div className="space-y-1">
                <p className="font-semibold text-base">{selected.name}</p>
                {selected.description && (
                  <p className="text-sm text-muted-foreground">
                    {selected.description}
                  </p>
                )}
              </div>

              <DatePickerField
                label="Ngày bắt đầu của mốc đầu tiên"
                placeholder="Chọn ngày"
                value={startDate}
                onChange={setStartDate}
              />

              <div className="rounded-md border divide-y">
                {previewItems.map((p) => (
                  <div key={p.index} className="flex items-start gap-3 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-mono text-primary">
                      #{p.milestoneOrder}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{p.stageName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.expectedStartDate || "—"} → {p.expectedEndDate || "—"}
                        {p.daysBetween != null && p.daysBetween > 0
                          ? ` · cách mốc trước ${p.daysBetween} ngày`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {step === "preview" && (
              <Button
                variant="outline"
                onClick={() => setStep("browse")}
                disabled={createBatchMutation.isPending}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Quay lại
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBatchMutation.isPending}
            >
              Hủy
            </Button>
            {step === "preview" && (
              <Button
                onClick={handleApplyClick}
                disabled={createBatchMutation.isPending || !startDate}
              >
                {createBatchMutation.isPending
                  ? "Đang áp dụng..."
                  : `Tạo ${previewItems.length} mốc`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAppend}
        title="Thêm các mốc từ mẫu?"
        description={`Mùa vụ đã có ${nextMilestoneOrder - 1} mốc. Các mốc từ mẫu sẽ được thêm vào cuối danh sách (không ghi đè).`}
        confirmLabel="Thêm vào cuối"
        onCancel={() => setConfirmAppend(false)}
        onConfirm={() => {
          setConfirmAppend(false);
          submitApply();
        }}
      />
    </>
  );
}
