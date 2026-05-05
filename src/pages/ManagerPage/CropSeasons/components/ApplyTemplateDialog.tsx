import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  usePreviewFromTemplate,
  useSeasonTemplateList,
} from "@/queries/useSeasonTemplate";
import {
  FARM_TYPE_LABEL,
  SENSOR_TYPE_LABEL,
  type FarmTypeT,
  type PreviewFromTemplateResT,
  type SensorTypeT,
} from "@/schemaValidatation/seasonTemplate";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  Gauge,
  Layers,
  ListChecks,
  Loader2,
  Sparkles,
  Sprout,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export interface AppliedTemplateResult {
  preview: PreviewFromTemplateResT;
  startDate: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optional farmType filter — only show matching templates (BR-114).
  farmType?: FarmTypeT;
  // Default startDate (ISO date string yyyy-MM-dd).
  defaultStartDate?: string;
  // Callback when user confirms — caller decides how to merge.
  onApply: (result: AppliedTemplateResult) => void;
}

export default function ApplyTemplateDialog({
  open,
  onOpenChange,
  farmType,
  defaultStartDate,
  onApply,
}: Props) {
  const [step, setStep] = useState<"select" | "preview">("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    defaultStartDate ?? new Date().toISOString().slice(0, 10),
  );
  const [filterFarmType, setFilterFarmType] = useState<FarmTypeT | "all">(
    farmType ?? "all",
  );
  const [preview, setPreview] = useState<PreviewFromTemplateResT | null>(null);

  // Reset on close.
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedId(null);
      setPreview(null);
    }
  }, [open]);

  const listQuery = useSeasonTemplateList({
    page: 1,
    limit: 50,
    farmType: filterFarmType === "all" ? undefined : filterFarmType,
  });
  const previewMut = usePreviewFromTemplate();

  const items = listQuery.data?.data?.data ?? [];
  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) ?? null,
    [items, selectedId],
  );

  const handlePreview = async () => {
    if (!selectedId) {
      toast.error("Hãy chọn một mẫu trước.");
      return;
    }
    if (!startDate) {
      toast.error("Hãy chọn ngày bắt đầu vụ.");
      return;
    }
    try {
      const res = await previewMut.mutateAsync({
        templateId: selectedId,
        startDate: new Date(startDate).toISOString(),
        farmType: farmType,
      });
      setPreview(res.data);
      setStep("preview");
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onApply({ preview, startDate });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            Bắt đầu từ Mẫu
            {step === "preview" && preview && (
              <Badge variant="outline">
                {preview.meta.templateName} · v
                {preview.meta.appliedTemplateVersion ?? 1}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Chọn mẫu khởi tạo nhanh giai đoạn, công việc và ngưỡng cảm biến cho vụ mới. Bạn có thể chỉnh tự do sau khi prefill."
              : "Xem trước nội dung sẽ được prefill. Sau khi áp dụng, bạn vẫn có thể chỉnh từng mục trong form."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Ngày bắt đầu vụ *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Loại trang trại</Label>
                <Select
                  value={filterFarmType}
                  onValueChange={(v) =>
                    setFilterFarmType(v as FarmTypeT | "all")
                  }
                  disabled={Boolean(farmType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mọi loại</SelectItem>
                    {(Object.keys(FARM_TYPE_LABEL) as FarmTypeT[]).map((f) => (
                      <SelectItem
                        key={f}
                        value={f}
                      >
                        {FARM_TYPE_LABEL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Chọn mẫu</Label>
              {listQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Không có mẫu phù hợp với loại trang trại này.
                </div>
              ) : (
                <div className="h-72 overflow-y-auto rounded-md border p-2">
                  <div className="space-y-2">
                    {items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={`w-full rounded-md border p-3 text-left transition hover:bg-accent ${
                          selectedId === t.id
                            ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium flex items-center gap-2">
                            <Sprout className="h-4 w-4 text-emerald-600" />
                            {t.name ?? "(không tên)"}
                            <Badge variant="outline">v{t.version ?? 1}</Badge>
                          </div>
                          <Badge variant="secondary">
                            {t.farmType
                              ? FARM_TYPE_LABEL[t.farmType as FarmTypeT]
                              : "—"}
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Layers className="h-3 w-3" /> {t.itemCount} mục
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          preview && (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <PreviewBody preview={preview} />
            </div>
          )
        )}

        <DialogFooter>
          {step === "select" ? (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!selected || previewMut.isPending}
              >
                {previewMut.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-1 h-4 w-4" />
                )}
                Xem trước prefill
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep("select")}
              >
                Quay lại
              </Button>
              <Button onClick={handleConfirm}>
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Áp dụng vào form
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ preview }: { preview: PreviewFromTemplateResT }) {
  return (
    <div className="space-y-3 pr-1">
      {preview.milestones.length === 0 && (
        <p className="text-sm italic text-muted-foreground">
          Mẫu không có giai đoạn nào.
        </p>
      )}
      {preview.milestones.map((m, i) => (
        <Card
          key={i}
          className="border-l-4 border-l-emerald-500"
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 border-emerald-200"
                >
                  #{i + 1}
                </Badge>
                {m.stageName}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {new Date(m.expectedStartDate).toLocaleDateString("vi-VN")} →{" "}
                {new Date(m.expectedEndDate).toLocaleDateString("vi-VN")}
              </div>
            </div>
            {m.suggestedNotes && (
              <p className="text-xs italic text-muted-foreground">
                {m.suggestedNotes}
              </p>
            )}
            {m.tasks.length > 0 && (
              <div>
                <div className="text-xs font-medium flex items-center gap-1 mb-1">
                  <ListChecks className="h-3 w-3" /> Công việc ({m.tasks.length}
                  )
                </div>
                <ul className="text-xs space-y-0.5 pl-4 list-disc text-muted-foreground">
                  {m.tasks.map((t, ti) => (
                    <li key={ti}>
                      <span className="text-foreground">{t.title}</span>
                      {t.expectedDurationDays != null &&
                        ` · ${t.expectedDurationDays} ngày`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.thresholds.length > 0 && (
              <div>
                <div className="text-xs font-medium flex items-center gap-1 mb-1">
                  <Gauge className="h-3 w-3" /> Ngưỡng cảm biến
                </div>
                <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
                  {m.thresholds.map((th, ti) => (
                    <div
                      key={ti}
                      className="rounded border bg-muted/30 px-2 py-1 text-xs"
                    >
                      <div className="font-medium">
                        {SENSOR_TYPE_LABEL[th.sensorType as SensorTypeT] ??
                          th.sensorType}
                      </div>
                      <div className="text-muted-foreground tabular-nums">
                        {th.optimalMin} – {th.optimalMax}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {preview.seasonLevelThresholds.length > 0 && (
        <Card className="border-amber-200/60 bg-amber-50/40">
          <CardContent className="p-3 space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Gauge className="h-4 w-4 text-amber-600" />
              Ngưỡng chung toàn vụ
            </div>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
              {preview.seasonLevelThresholds.map((th, ti) => (
                <div
                  key={ti}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  <div className="font-medium">
                    {SENSOR_TYPE_LABEL[th.sensorType as SensorTypeT] ??
                      th.sensorType}
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {th.optimalMin} – {th.optimalMax}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
