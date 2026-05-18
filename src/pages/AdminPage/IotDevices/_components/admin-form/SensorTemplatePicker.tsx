import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Cpu, FileText, Info } from "lucide-react";
import { useState } from "react";
import {
  useAdminListSensorTemplates,
  useAdminSensorTemplateDetail,
} from "@/queries/useIotTemplate";
import type { SensorTemplateResType } from "@/schemaValidatation/iotTemplate";
import {
  SENSOR_TEMPLATE_TYPE_LABEL,
  SENSOR_TYPE_ICON,
} from "./constants";

export function SensorTemplatePicker({
  onApply,
}: {
  onApply: (template: SensorTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data: templatesRes, isLoading } = useAdminListSensorTemplates({
    page: 1,
    limit: 50,
  });
  const { data: detailRes } = useAdminSensorTemplateDetail(
    previewId ?? "",
    !!previewId,
  );

  const templates = templatesRes?.data?.data ?? [];
  const detail = detailRes?.data;

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <>
      <div className="rounded-md border border-dashed border-primary/30 bg-primary/2 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Áp dụng từ mẫu cảm biến</span>
          <Badge
            variant="outline"
            className="text-[10px] font-normal"
          >
            Tùy chọn
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => {
            const SIcon = SENSOR_TYPE_ICON[t.type] ?? Cpu;
            return (
              <Button
                key={t.id}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[11px] px-2"
                onClick={() => setPreviewId(t.id)}
              >
                <SIcon className="h-3 w-3" />
                {t.name}
              </Button>
            );
          })}
        </div>
      </div>

      <Sheet
        open={!!previewId}
        onOpenChange={() => {
          setPreviewId(null);
          setSelectedItemId(null);
        }}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Chọn cảm biến từ mẫu
            </SheetTitle>
            <SheetDescription>
              Chọn một cảm biến bên dưới để thêm vào danh sách.
            </SheetDescription>
          </SheetHeader>

          {detail ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{detail.name}</h4>
                {detail.description && (
                  <p className="text-xs text-muted-foreground">
                    {detail.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {SENSOR_TEMPLATE_TYPE_LABEL[detail.type] ?? detail.type}
                  </Badge>
                  <Badge variant="outline">v{detail.version}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nhấn vào cảm biến để chọn
                </p>
                {detail.items.map((item) => {
                  const IIcon = SENSOR_TYPE_ICON[item.sensorType] ?? Cpu;
                  const isSelected = selectedItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setSelectedItemId(isSelected ? null : item.id)
                      }
                      className={`w-full rounded-md border p-2.5 text-left transition-colors space-y-1.5 ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IIcon
                            className={`h-4 w-4 ${
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {item.sensorModelName ??
                              SENSOR_TEMPLATE_TYPE_LABEL[item.sensorType] ??
                              item.sensorType}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {item.minValue != null && (
                          <span>Tối thiểu: {item.minValue}</span>
                        )}
                        {item.maxValue != null && (
                          <span>Tối đa: {item.maxValue}</span>
                        )}
                        {item.optimalMin != null && (
                          <span>Tối ưu thấp: {item.optimalMin}</span>
                        )}
                        {item.optimalMax != null && (
                          <span>Tối ưu cao: {item.optimalMax}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Cảm biến được chọn sẽ điền sẵn loại và các giá trị ngưỡng. Bạn
                  vẫn có thể chỉnh sửa sau.
                </p>
              </div>

              <Button
                className="w-full"
                disabled={!selectedItemId}
                onClick={() => {
                  const item = detail.items.find(
                    (it) => it.id === selectedItemId,
                  );
                  if (!item) return;
                  onApply({ ...detail, items: [item] });
                  setPreviewId(null);
                  setSelectedItemId(null);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                {selectedItemId
                  ? "Áp dụng cảm biến đã chọn"
                  : "Chưa chọn cảm biến"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 px-4 pb-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
