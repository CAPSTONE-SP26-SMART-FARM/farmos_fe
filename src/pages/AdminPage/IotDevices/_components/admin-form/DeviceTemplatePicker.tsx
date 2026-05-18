import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { z } from "zod";
import {
  useAdminIotDeviceTemplateDetail,
  useAdminListIotDeviceTemplates,
} from "@/queries/useIotTemplate";
import type { IotDeviceTypeSchema } from "@/schemaValidatation/iotDevice";
import type { IotDeviceTemplateResType } from "@/schemaValidatation/iotTemplate";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
} from "@/constants/iotDeviceDisplay";

export function DeviceTemplatePicker({
  deviceType,
  onApply,
}: {
  deviceType: z.infer<typeof IotDeviceTypeSchema>;
  onApply: (template: IotDeviceTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { data: templatesRes, isLoading } = useAdminListIotDeviceTemplates({
    page: 1,
    limit: 50,
    type: deviceType,
  });
  const { data: detailRes } = useAdminIotDeviceTemplateDetail(
    previewId ?? "",
    !!previewId,
  );

  const templates = templatesRes?.data?.data ?? [];
  const detail = detailRes?.data;

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) return null;

  return (
    <>
      <Card className="border-dashed border-primary/30 bg-primary/2">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Áp dụng từ mẫu</CardTitle>
            <Badge
              variant="outline"
              className="text-xs font-normal"
            >
              Tùy chọn
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Chọn mẫu để tự động điền cho thiết bị hiện tại (
            {DEVICE_TYPE_LABEL[deviceType] ?? deviceType}). Nếu mẫu có nhiều
            thiết bị, hệ thống chỉ áp dụng một thiết bị phù hợp với loại đang
            chọn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => {
              const TIcon = DEVICE_TYPE_ICON[t.type] ?? Cpu;
              return (
                <Button
                  key={t.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setPreviewId(t.id)}
                >
                  <TIcon className="h-3.5 w-3.5" />
                  {t.name}
                  <span className="text-muted-foreground">
                    ({t.items.length} thiết bị)
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
              Chọn thiết bị từ mẫu
            </SheetTitle>
            <SheetDescription>
              Chọn một thiết bị bên dưới để điền vào biểu mẫu.
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
                    {DEVICE_TYPE_LABEL[detail.type] ?? detail.type}
                  </Badge>
                  <Badge variant={detail.isActive ? "default" : "outline"}>
                    {detail.isActive ? "Đang hoạt động" : "Tắt"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Nhấn vào thiết bị để chọn
                </p>
                {detail.items.map((item, i) => {
                  const IIcon = DEVICE_TYPE_ICON[item.deviceType] ?? Cpu;
                  const isSelected = selectedItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setSelectedItemId(isSelected ? null : item.id)
                      }
                      className={`w-full flex items-center gap-3 rounded-md border p-2.5 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/40"
                      }`}
                    >
                      <IIcon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.deviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {DEVICE_TYPE_LABEL[item.deviceType] ??
                            item.deviceType}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          #{i + 1}
                        </Badge>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
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
                  Giá trị từ thiết bị được chọn sẽ điền vào biểu mẫu. Bạn vẫn có
                  thể chỉnh sửa sau.
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
                  ? "Áp dụng thiết bị đã chọn"
                  : "Chưa chọn thiết bị"}
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
