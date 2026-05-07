import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Cpu,
  CircuitBoard,
  Radio,
  Wifi,
  FileText,
  Check,
  Info,
  Droplets,
  Thermometer,
  CloudRain,
  Sun,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  Controller,
  type UseFormSetValue,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCreateIotDeviceBatch,
  useAdminCreateSensorBatch,
  useAdminIotDeviceDetail,
  useAdminUpdateIotDevice,
  useManagerCreateIotDevices,
  useManagerUpdateIotDevice,
  useOwnerCreateIotDevices,
  useOwnerUpdateIotDevice,
} from "@/queries/useIotDevice";
import {
  useManagerCreateSensors,
  useManagerListSensors,
  useOwnerCreateSensors,
  useOwnerListSensors,
} from "@/queries/useSensor";
import {
  useAdminIotDeviceTemplateDetail,
  useAdminListIotDeviceTemplates,
  useAdminListSensorTemplates,
  useAdminSensorTemplateDetail,
  useManagerIotDeviceTemplateDetail,
  useManagerListIotDeviceTemplates,
  useManagerListSensorTemplates,
  useManagerSensorTemplateDetail,
  useOwnerIotDeviceTemplateDetail,
  useOwnerListIotDeviceTemplates,
  useOwnerListSensorTemplates,
  useOwnerSensorTemplateDetail,
} from "@/queries/useIotTemplate";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  DeviceStatusSchema,
  type IotDeviceDetailResType,
  IotDeviceTypeSchema,
  type IotDeviceResType,
  type UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import { SensorTypeSchema } from "@/schemaValidatation/sensor";
import type {
  IotDeviceTemplateResType,
  SensorTemplateResType,
} from "@/schemaValidatation/iotTemplate";
import {
  isApiErrorUnprocessableEntityResponse,
  isApiErrorResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { toast } from "sonner";

type IotActor = "owner" | "manager" | "admin";

// ── Form schemas ───────────────────────────────────────────────────────

const DeviceItemFormSchema = z
  .object({
    deviceName: z.string().trim().min(1, "Tên thiết bị là bắt buộc").max(255),
    deviceType: IotDeviceTypeSchema,
    macAddress: z
      .string()
      .max(17)
      .regex(
        /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
        "Định dạng MAC không hợp lệ",
      )
      .or(z.literal("")),
    status: DeviceStatusSchema,
  })
  .superRefine((data, ctx) => {
    if (data.deviceType === "wifi_module" && !data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Địa chỉ MAC là bắt buộc cho mô-đun WiFi",
        path: ["macAddress"],
      });
    }

    if (data.deviceType !== "wifi_module" && data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Chỉ mô-đun WiFi mới cần địa chỉ MAC",
        path: ["macAddress"],
      });
    }
  });

const BatchCreateFormSchema = z
  .object({
    devices: z.array(DeviceItemFormSchema).min(3, "Cần ít nhất 3 thiết bị"),
  })
  .superRefine((data, ctx) => {
    const typeCounts = new Map<string, number>();
    data.devices.forEach((d) => {
      typeCounts.set(d.deviceType, (typeCounts.get(d.deviceType) ?? 0) + 1);
    });

    // Exactly 1 board_module
    const boardCount = typeCounts.get("board_module") ?? 0;
    if (boardCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có đúng 1 bo mạch (hiện có ${boardCount})`,
        path: ["devices"],
      });
    }

    // All 3 types required
    const required: z.infer<typeof IotDeviceTypeSchema>[] = [
      "board_module",
      "lora_module",
      "wifi_module",
    ];
    const missing = required.filter((r) => !typeCounts.has(r));
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Phải có ít nhất 1 thiết bị mỗi loại. Thiếu: ${missing.map((m) => DEVICE_TYPE_LABEL[m]).join(", ")}`,
        path: ["devices"],
      });
    }

    // Unique MAC addresses (among devices that have one)
    const macs = new Set<string>();
    data.devices.forEach((d, i) => {
      if (d.macAddress) {
        const mac = d.macAddress.toUpperCase();
        if (macs.has(mac)) {
          ctx.addIssue({
            code: "custom",
            message: "MAC bị trùng",
            path: ["devices", i, "macAddress"],
          });
        }
        macs.add(mac);
      }
    });
  });

const EditFormSchema = z
  .object({
    deviceName: z.string().trim().min(1, "Tên thiết bị là bắt buộc").max(255),
    deviceType: IotDeviceTypeSchema,
    macAddress: z
      .string()
      .max(17)
      .regex(
        /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
        "Định dạng MAC không hợp lệ",
      )
      .or(z.literal("")),
    status: DeviceStatusSchema,
  })
  .superRefine((data, ctx) => {
    if (data.deviceType === "wifi_module" && !data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Địa chỉ MAC là bắt buộc cho mô-đun WiFi",
        path: ["macAddress"],
      });
    }

    if (data.deviceType !== "wifi_module" && data.macAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Chỉ mô-đun WiFi mới cần địa chỉ MAC",
        path: ["macAddress"],
      });
    }
  });

// Sensor batch form for adding sensors to a board
const SensorItemFormSchema = z.object({
  sensorType: SensorTypeSchema,
  minValue: z
    .number()
    .refine(Number.isFinite, "Giá trị tối thiểu không hợp lệ"),
  maxValue: z.number().refine(Number.isFinite, "Giá trị tối đa không hợp lệ"),
});

const SensorBatchFormSchema = z
  .object({
    items: z
      .array(SensorItemFormSchema)
      .min(1, "Cần ít nhất 1 cảm biến")
      .max(4, "Mỗi lần chỉ thêm tối đa 4 cảm biến"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();

    data.items.forEach((item, index) => {
      if (seen.has(item.sensorType)) {
        ctx.addIssue({
          code: "custom",
          message: "Mỗi loại cảm biến chỉ được xuất hiện 1 lần",
          path: ["items", index, "sensorType"],
        });
      }

      seen.add(item.sensorType);

      if (item.minValue > item.maxValue) {
        ctx.addIssue({
          code: "custom",
          message: "Giá trị tối thiểu phải nhỏ hơn hoặc bằng tối đa",
          path: ["items", index, "minValue"],
        });
      }
    });
  });

type BatchCreateFormType = z.infer<typeof BatchCreateFormSchema>;
type EditFormType = z.infer<typeof EditFormSchema>;
type SensorBatchFormType = z.infer<typeof SensorBatchFormSchema>;

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Bo mạch",
  lora_module: "Mô-đun LoRa",
  wifi_module: "Mô-đun WiFi",
};

const DEVICE_TYPE_ICON: Record<string, typeof Cpu> = {
  board_module: CircuitBoard,
  lora_module: Radio,
  wifi_module: Wifi,
};

const STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  maintenance: "Bảo trì",
  retired: "Ngưng hoạt động",
};

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

const SENSOR_TYPE_VALUES = Object.keys(SENSOR_TYPE_LABEL) as Array<
  z.infer<typeof SensorTypeSchema>
>;

const SENSOR_TEMPLATE_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  air_temperature_sensor: "Nhiệt độ không khí",
  air_humidity_sensor: "Độ ẩm không khí",
  light_intensity_sensor: "Cường độ ánh sáng",
};

const SENSOR_TYPE_ICON: Record<string, typeof Cpu> = {
  soil_moisture: Droplets,
  air_temperature: Thermometer,
  air_humidity: CloudRain,
  light_intensity: Sun,
  soil_moisture_sensor: Droplets,
  air_temperature_sensor: Thermometer,
  air_humidity_sensor: CloudRain,
  light_intensity_sensor: Sun,
};

// ── IoT Device Template Picker ─────────────────────────────────────────

function DeviceTemplatePicker({
  actor,
  deviceType,
  onApply,
}: {
  actor: IotActor;
  deviceType: z.infer<typeof IotDeviceTypeSchema>;
  onApply: (template: IotDeviceTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { data: adminTemplatesRes, isLoading: adminLoading } =
    useAdminListIotDeviceTemplates({
      page: 1,
      limit: 50,
      type: deviceType,
    });
  const { data: ownerTemplatesRes, isLoading: ownerLoading } =
    useOwnerListIotDeviceTemplates(
      {
        page: 1,
        limit: 50,
        type: deviceType,
      },
      actor === "owner",
    );
  const { data: managerTemplatesRes, isLoading: managerLoading } =
    useManagerListIotDeviceTemplates(
      {
        page: 1,
        limit: 50,
        type: deviceType,
      },
      actor === "manager",
    );

  const { data: adminDetailRes } = useAdminIotDeviceTemplateDetail(
    previewId ?? "",
    actor === "admin" && !!previewId,
  );

  const { data: ownerDetailRes } = useOwnerIotDeviceTemplateDetail(
    previewId ?? "",
    actor === "owner" && !!previewId,
  );
  const { data: managerDetailRes } = useManagerIotDeviceTemplateDetail(
    previewId ?? "",
    actor === "manager" && !!previewId,
  );

  const templatesRes =
    actor === "admin"
      ? adminTemplatesRes
      : actor === "owner"
        ? ownerTemplatesRes
        : managerTemplatesRes;
  const detailRes =
    actor === "admin"
      ? adminDetailRes
      : actor === "owner"
        ? ownerDetailRes
        : managerDetailRes;
  const isLoading =
    actor === "admin"
      ? adminLoading
      : actor === "owner"
        ? ownerLoading
        : managerLoading;

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

// ── Sensor Template Picker ─────────────────────────────────────────────

function SensorTemplatePicker({
  actor,
  onApply,
}: {
  actor: IotActor;
  onApply: (template: SensorTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { data: adminTemplatesRes, isLoading: adminLoading } =
    useAdminListSensorTemplates({
      page: 1,
      limit: 50,
    });
  const { data: ownerTemplatesRes, isLoading: ownerLoading } =
    useOwnerListSensorTemplates(
      {
        page: 1,
        limit: 50,
      },
      actor === "owner",
    );
  const { data: managerTemplatesRes, isLoading: managerLoading } =
    useManagerListSensorTemplates(
      {
        page: 1,
        limit: 50,
      },
      actor === "manager",
    );

  const { data: adminDetailRes } = useAdminSensorTemplateDetail(
    previewId ?? "",
    actor === "admin" && !!previewId,
  );

  const { data: ownerDetailRes } = useOwnerSensorTemplateDetail(
    previewId ?? "",
    actor === "owner" && !!previewId,
  );
  const { data: managerDetailRes } = useManagerSensorTemplateDetail(
    previewId ?? "",
    actor === "manager" && !!previewId,
  );

  const templatesRes =
    actor === "admin"
      ? adminTemplatesRes
      : actor === "owner"
        ? ownerTemplatesRes
        : managerTemplatesRes;
  const detailRes =
    actor === "admin"
      ? adminDetailRes
      : actor === "owner"
        ? ownerDetailRes
        : managerDetailRes;
  const isLoading =
    actor === "admin"
      ? adminLoading
      : actor === "owner"
        ? ownerLoading
        : managerLoading;

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

// ── Main component ─────────────────────────────────────────────────────

interface IotDeviceFormProps {
  farmId: string;
  device?: IotDeviceResType | IotDeviceDetailResType;
  onBack: () => void;
  actor?: IotActor;
}

export default function IotDeviceForm({
  farmId,
  device,
  onBack,
  actor = "owner",
}: IotDeviceFormProps) {
  const isEdit = !!device;
  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingData, setPendingData] = useState<EditFormType | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  if (isEdit) {
    return (
      <EditDeviceForm
        farmId={farmId}
        device={device}
        actor={actor}
        show={show}
        confirmSave={confirmSave}
        pendingData={pendingData}
        setConfirmSave={setConfirmSave}
        setPendingData={setPendingData}
        handleBack={handleBack}
      />
    );
  }

  return (
    <BatchCreateForm
      farmId={farmId}
      actor={actor}
      show={show}
      handleBack={handleBack}
    />
  );
}

// ── Device item card (batch create) ────────────────────────────────────

function DeviceItemCard({
  actor,
  index,
  control,
  setValue,
  canRemove,
  boardTakenByOther,
  onApplyTemplate,
  onRemove,
}: {
  actor: IotActor;
  index: number;
  control: import("react-hook-form").Control<BatchCreateFormType>;
  setValue: UseFormSetValue<BatchCreateFormType>;
  canRemove: boolean;
  boardTakenByOther: boolean;
  onApplyTemplate: (index: number, template: IotDeviceTemplateResType) => void;
  onRemove: () => void;
}) {
  const dtVal = useWatch({ control, name: `devices.${index}.deviceType` });
  const macValue = useWatch({ control, name: `devices.${index}.macAddress` });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;
  const showMac = dtVal === "wifi_module";
  const effectiveType = (dtVal ?? "wifi_module") as z.infer<
    typeof IotDeviceTypeSchema
  >;

  useEffect(() => {
    if (dtVal !== "wifi_module" && macValue) {
      setValue(`devices.${index}.macAddress`, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [dtVal, macValue, index, setValue]);

  return (
    <Card className="border-border/50 bg-muted/10">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <DIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Thiết bị #{index + 1}</CardTitle>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <DeviceTemplatePicker
          actor={actor}
          deviceType={effectiveType}
          onApply={(template) => onApplyTemplate(index, template)}
        />

        <FieldGroup>
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name={`devices.${index}.deviceName`}
              control={control}
              render={({ field: f, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Tên thiết bị *</FieldLabel>
                  <Input
                    {...f}
                    placeholder="VD: Bo mạch chính - Nông trại A"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
            <Controller
              name={`devices.${index}.deviceType`}
              control={control}
              render={({ field: f, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Loại thiết bị *</FieldLabel>
                  <Select
                    value={f.value}
                    onValueChange={f.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEVICE_TYPE_LABEL).map(([val, label]) => {
                        const disableBoardOption =
                          val === "board_module" &&
                          boardTakenByOther &&
                          f.value !== "board_module";

                        return (
                          <SelectItem
                            key={val}
                            value={val}
                            disabled={disableBoardOption}
                          >
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {showMac && (
              <Controller
                name={`devices.${index}.macAddress`}
                control={control}
                render={({ field: f, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Địa chỉ MAC *</FieldLabel>
                    <Input
                      {...f}
                      placeholder="AA:BB:CC:DD:EE:FF"
                      className="font-mono"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}
            <Controller
              name={`devices.${index}.status`}
              control={control}
              render={({ field: f, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Trạng thái</FieldLabel>
                  <Select
                    value={f.value}
                    onValueChange={f.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([val, label]) => (
                        <SelectItem
                          key={val}
                          value={val}
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

// ── Batch Create ───────────────────────────────────────────────────────

function BatchCreateForm({
  farmId,
  actor,
  show,
  handleBack,
}: {
  farmId: string;
  actor: IotActor;
  show: boolean;
  handleBack: () => void;
}) {
  const adminCreateMutation = useAdminCreateIotDeviceBatch();
  const ownerCreateMutation = useOwnerCreateIotDevices();
  const managerCreateMutation = useManagerCreateIotDevices();
  const createAsync = ({
    farmId,
    body,
  }: {
    farmId: string;
    body: BatchCreateFormType;
  }) => {
    if (actor === "admin") {
      return adminCreateMutation.mutateAsync({
        farmId: farmId.trim() || undefined,
        body,
      });
    }

    if (actor === "owner") {
      return ownerCreateMutation.mutateAsync({
        farmId,
        body,
      });
    }

    return managerCreateMutation.mutateAsync({
      farmId,
      body,
    });
  };
  const isPending =
    actor === "admin"
      ? adminCreateMutation.isPending
      : actor === "owner"
        ? ownerCreateMutation.isPending
        : managerCreateMutation.isPending;

  const form = useForm<BatchCreateFormType>({
    resolver: zodResolver(BatchCreateFormSchema),
    defaultValues: {
      devices: [
        {
          deviceName: "",
          deviceType: "board_module",
          macAddress: "",
          status: "active",
        },
        {
          deviceName: "",
          deviceType: "lora_module",
          macAddress: "",
          status: "active",
        },
        {
          deviceName: "",
          deviceType: "wifi_module",
          macAddress: "",
          status: "active",
        },
      ],
    },
  });

  useClearServerFieldErrors(form);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "devices",
  });

  const watchedDevices =
    useWatch({ control: form.control, name: "devices" }) ?? [];

  const boardCount = watchedDevices.filter(
    (d) => d?.deviceType === "board_module",
  ).length;
  const loraCount = watchedDevices.filter(
    (d) => d?.deviceType === "lora_module",
  ).length;
  const wifiCount = watchedDevices.filter(
    (d) => d?.deviceType === "wifi_module",
  ).length;

  const applyDeviceTemplateAt = (
    index: number,
    template: IotDeviceTemplateResType,
  ) => {
    const currentType = (form.getValues(`devices.${index}.deviceType`) ??
      "wifi_module") as z.infer<typeof IotDeviceTypeSchema>;

    const typeMatchedItems = template.items.filter(
      (item) => (item.deviceType ?? template.type) === currentType,
    );
    const selectedItem = typeMatchedItems[0] ?? template.items[0];

    if (!selectedItem) return;

    const selectedType = (selectedItem.deviceType ?? template.type) as z.infer<
      typeof IotDeviceTypeSchema
    >;

    form.setValue(
      `devices.${index}.deviceName`,
      selectedItem.deviceName ?? "",
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    form.setValue(`devices.${index}.deviceType`, selectedType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`devices.${index}.macAddress`, "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: BatchCreateFormType) => {
    try {
      await createAsync({
        farmId,
        body: {
          devices: data.devices.map((d) => ({
            ...d,
            deviceName: d.deviceName.trim(),
            macAddress: d.macAddress ? d.macAddress.toUpperCase() : d.macAddress,
          })),
        },
      });
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        const apiErrors = error.response!.data.errors;
        const macErrors = apiErrors.filter((e) => e.field === "macAddress");
        const otherErrors = apiErrors.filter((e) => e.field !== "macAddress");

        // Map macAddress errors to the actual nested field paths
        if (macErrors.length > 0) {
          const macMsg = "Địa chỉ MAC này đã được đăng ký.";
          data.devices.forEach((device, i) => {
            if (device.deviceType === "wifi_module" && device.macAddress) {
              form.setError(`devices.${i}.macAddress`, {
                type: "server",
                message: macMsg,
              });
            }
          });
        }

        if (otherErrors.length > 0) {
          handleApiErrorUnprocessentity(otherErrors, form.setError, {
            getValues: form.getValues,
          });
        }

        return;
      }
    }
  };

  const rootError =
    form.formState.errors.devices?.root?.message ??
    form.formState.errors.devices?.message;

  return (
    <div
      className={`transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-lg font-semibold">Thêm thiết bị IoT</h2>
        <Badge
          variant="secondary"
          className="gap-1"
        >
          <Cpu className="h-3 w-3" />
          Hàng loạt
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách thiết bị</CardTitle>
              <CardDescription>
                Thêm ít nhất 3 thiết bị: đúng 1 bo mạch, ít nhất 1 mô-đun LoRa,
                ít nhất 1 mô-đun WiFi.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={boardCount === 1 ? "default" : "destructive"}
                  className="text-xs"
                >
                  Bo mạch: {boardCount}/1
                </Badge>
                <Badge
                  variant={loraCount >= 1 ? "default" : "destructive"}
                  className="text-xs"
                >
                  LoRa: {loraCount}/1+
                </Badge>
                <Badge
                  variant={wifiCount >= 1 ? "default" : "destructive"}
                  className="text-xs"
                >
                  WiFi: {wifiCount}/1+
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {rootError && (
                <p className="text-sm text-destructive">{rootError}</p>
              )}

              {fields.map((field, index) => (
                <DeviceItemCard
                  key={field.id}
                  actor={actor}
                  index={index}
                  control={form.control}
                  setValue={form.setValue}
                  boardTakenByOther={
                    boardCount -
                      (watchedDevices[index]?.deviceType === "board_module"
                        ? 1
                        : 0) >
                    0
                  }
                  onApplyTemplate={applyDeviceTemplateAt}
                  canRemove={fields.length > 3}
                  onRemove={() => remove(index)}
                />
              ))}

              <div className="grid gap-2 md:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={boardCount >= 1}
                  onClick={() =>
                    append({
                      deviceName: "",
                      deviceType: "board_module",
                      macAddress: "",
                      status: "active",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm bo mạch
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      deviceName: "",
                      deviceType: "lora_module",
                      macAddress: "",
                      status: "active",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm LoRa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      deviceName: "",
                      deviceType: "wifi_module",
                      macAddress: "",
                      status: "active",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm WiFi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo {fields.length} thiết bị
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Edit Single Device ─────────────────────────────────────────────────

function EditDeviceForm({
  farmId,
  device,
  actor,
  show,
  confirmSave,
  pendingData,
  setConfirmSave,
  setPendingData,
  handleBack,
}: {
  farmId: string;
  device: IotDeviceResType | IotDeviceDetailResType;
  actor: IotActor;
  show: boolean;
  confirmSave: boolean;
  pendingData: EditFormType | null;
  setConfirmSave: (v: boolean) => void;
  setPendingData: (v: EditFormType | null) => void;
  handleBack: () => void;
}) {
  const adminUpdateMutation = useAdminUpdateIotDevice();
  const ownerUpdateMutation = useOwnerUpdateIotDevice();
  const managerUpdateMutation = useManagerUpdateIotDevice();
  const updateAsync = ({
    deviceId,
    farmId,
    body,
  }: {
    deviceId: string;
    farmId: string;
    body: UpdateIotDeviceBodyType;
  }) => {
    if (actor === "admin") {
      return adminUpdateMutation.mutateAsync({ deviceId, body });
    }

    if (actor === "owner") {
      return ownerUpdateMutation.mutateAsync({ deviceId, farmId, body });
    }

    return managerUpdateMutation.mutateAsync({ deviceId, farmId, body });
  };
  const isPending =
    actor === "admin"
      ? adminUpdateMutation.isPending
      : actor === "owner"
        ? ownerUpdateMutation.isPending
        : managerUpdateMutation.isPending;


  const isBoard = device.deviceType === "board_module";

  const deviceSubDevices =
    "subDevices" in device && Array.isArray(device.subDevices)
      ? device.subDevices
      : [];
  const [editableSubDevices, setEditableSubDevices] = useState(
    deviceSubDevices.map((sub) => ({
      id: sub.id,
      deviceName: sub.deviceName,
      deviceType: sub.deviceType,
      status: sub.status,
      macAddress: sub.macAddress ?? "",
      isDirty: false,
      isSaving: false,
    })),
  );

  useEffect(() => {
    setEditableSubDevices(
      deviceSubDevices.map((sub) => ({
        id: sub.id,
        deviceName: sub.deviceName,
        deviceType: sub.deviceType,
        status: sub.status,
        macAddress: sub.macAddress ?? "",
        isDirty: false,
        isSaving: false,
      })),
    );
  }, [device.id]);

  const patchSubDevice = (
    id: string,
    patch: Partial<{
      deviceName: string;
      status: z.infer<typeof DeviceStatusSchema>;
      macAddress: string;
    }>,
  ) => {
    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              isDirty: true,
            }
          : item,
      ),
    );
  };

  const saveSubDevice = async (id: string) => {
    const target = editableSubDevices.find((item) => item.id === id);
    if (!target) return;

    const normalizedMac = target.macAddress.trim().toUpperCase();

    setEditableSubDevices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isSaving: true,
            }
          : item,
      ),
    );

    try {
      await updateAsync({
        deviceId: target.id,
        farmId,
        body: {
          deviceName: target.deviceName.trim(),
          status: target.status,
          ...(target.deviceType === "wifi_module" && normalizedMac
            ? { macAddress: normalizedMac }
            : {}),
        },
      });

      setEditableSubDevices((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                macAddress: normalizedMac || item.macAddress,
                isDirty: false,
                isSaving: false,
              }
            : item,
        ),
      );
      toast.success("Cập nhật thiết bị con thành công");
    } catch (error) {
      setEditableSubDevices((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isSaving: false,
              }
            : item,
        ),
      );

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Cập nhật thiết bị con thất bại");
        return;
      }

      toast.error("Cập nhật thiết bị con thất bại");
    }
  };

  const ownerSensorsQuery = useOwnerListSensors(
    device.id,
    { page: 1, limit: 100 },
    actor === "owner" && isBoard,
  );
  const managerSensorsQuery = useManagerListSensors(
    device.id,
    { page: 1, limit: 100 },
    actor === "manager" && isBoard,
  );
  const adminDetailQuery = useAdminIotDeviceDetail(
    device.id,
    actor === "admin" && isBoard,
  );
  const existingSensors =
    actor === "admin"
      ? (adminDetailQuery.data?.data.sensors ?? []).map((s) => ({
          sensorType: s.sensorType,
          status: s.status,
          minValue: s.minValue,
          maxValue: s.maxValue,
        }))
      : actor === "owner"
        ? (ownerSensorsQuery.data?.data?.data ?? [])
        : (managerSensorsQuery.data?.data?.data ?? []);
  const existingSensorTypes = new Set(existingSensors.map((s) => s.sensorType));
  const remainingSensorSlots = Math.max(0, 4 - existingSensors.length);

  const adminCreateSensorsMutation = useAdminCreateSensorBatch();
  const ownerCreateSensorsMutation = useOwnerCreateSensors();
  const managerCreateSensorsMutation = useManagerCreateSensors();
  const createSensorsAsync = ({
    iotDeviceId,
    body,
  }: {
    iotDeviceId: string;
    body: { items: SensorBatchFormType["items"] };
  }) => {
    if (actor === "admin") return adminCreateSensorsMutation.mutateAsync({ deviceId: iotDeviceId, body });
    if (actor === "owner") return ownerCreateSensorsMutation.mutateAsync({ iotDeviceId, body });
    return managerCreateSensorsMutation.mutateAsync({ iotDeviceId, body });
  };
  const sensorsPending =
    actor === "admin"
      ? adminCreateSensorsMutation.isPending
      : actor === "owner"
        ? ownerCreateSensorsMutation.isPending
        : managerCreateSensorsMutation.isPending;
  const [showSensorForm, setShowSensorForm] = useState(false);

  const sensorForm = useForm<SensorBatchFormType>({
    resolver: zodResolver(SensorBatchFormSchema),
    defaultValues: { items: [{ sensorType: "soil_moisture", minValue: 0, maxValue: 100 }] },
  });
  useClearServerFieldErrors(sensorForm);

  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
    replace: replaceSensors,
  } = useFieldArray({ control: sensorForm.control, name: "items" });

  const currentSensorItems = useWatch({ control: sensorForm.control, name: "items" }) ?? [];

  const SENSOR_TEMPLATE_TO_SENSOR_TYPE: Record<string, string> = {
    soil_moisture_sensor: "soil_moisture",
    air_temperature_sensor: "air_temperature",
    air_humidity_sensor: "air_humidity",
    light_intensity_sensor: "light_intensity",
  };

  const applySensorTemplate = (template: SensorTemplateResType) => {
    const seen = new Set<string>();
    const mapped = template.items
      .map((item) => {
        const sensorType = SENSOR_TEMPLATE_TO_SENSOR_TYPE[item.sensorType] ?? item.sensorType;
        return { sensorType: sensorType as z.infer<typeof SensorTypeSchema>, minValue: item.minValue ?? 0, maxValue: item.maxValue ?? 100 };
      })
      .filter((item) => {
        if (existingSensorTypes.has(item.sensorType) || seen.has(item.sensorType)) return false;
        seen.add(item.sensorType);
        return true;
      })
      .slice(0, remainingSensorSlots);
    if (mapped.length > 0) { replaceSensors(mapped); setShowSensorForm(true); }
  };

  const onSensorSubmit = async (data: SensorBatchFormType) => {
    sensorForm.clearErrors("items");
    if (data.items.length > remainingSensorSlots) {
      sensorForm.setError("items", { type: "manual", message: `Chỉ có thể thêm tối đa ${remainingSensorSlots} cảm biến nữa.` });
      return;
    }
    const dup = data.items.find((item) => existingSensorTypes.has(item.sensorType));
    if (dup) {
      sensorForm.setError("items", { type: "manual", message: `${SENSOR_TYPE_LABEL[dup.sensorType] ?? dup.sensorType} đã tồn tại trên bo mạch.` });
      return;
    }
    try {
      await createSensorsAsync({ iotDeviceId: device.id, body: { items: data.items } });
      setShowSensorForm(false);
      const defaultSensorType = SENSOR_TYPE_VALUES.find((type) => !existingSensorTypes.has(type)) ?? "soil_moisture";
      sensorForm.reset({ items: [{ sensorType: defaultSensorType, minValue: 0, maxValue: 100 }] });
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<SensorBatchFormType>(error)) {
        handleApiErrorUnprocessentity<SensorBatchFormType>(error.response!.data.errors, sensorForm.setError, { getValues: sensorForm.getValues });
        return;
      }
      if (isApiErrorResponse(error)) { toast.error(error.response?.data.message ?? "Thêm cảm biến thất bại"); return; }
      toast.error("Thêm cảm biến thất bại");
    }
  };

  const form = useForm<EditFormType>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      deviceName: device.deviceName,
      deviceType: device.deviceType as z.infer<typeof IotDeviceTypeSchema>,
      macAddress: device.macAddress ?? "",
      status: device.status,
    },
  });

  useClearServerFieldErrors(form);

  const doSave = async (data: EditFormType) => {
    try {
      const normalizedMac = data.macAddress.trim().toUpperCase();
      const body: UpdateIotDeviceBodyType = {
        deviceName: data.deviceName.trim(),
        ...(data.deviceType === "wifi_module" && normalizedMac
          ? { macAddress: normalizedMac }
          : {}),
        status: data.status,
      };
      await updateAsync({ deviceId: device.id, farmId, body });
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
    }
  };

  const onValidSubmit = (data: EditFormType) => {
    setPendingData(data);
    setConfirmSave(true);
  };

  const dtVal = useWatch({ control: form.control, name: "deviceType" });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;

  useEffect(() => {
    if (dtVal !== "wifi_module" && form.getValues("macAddress")) {
      form.setValue("macAddress", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [dtVal, form]);

  return (
    <div
      className={`space-y-5 transition-all duration-300 ease-out ${show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div className="h-4 w-px bg-border" />
        <DIcon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Chỉnh sửa thiết bị</h2>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin thiết bị</CardTitle>
            <CardDescription>
              Cập nhật thông tin cấu hình thiết bị IoT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-3 md:grid-cols-2">
                <Controller
                  name="deviceName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Tên thiết bị *</FieldLabel>
                      <Input {...field} />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  name="deviceType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Loại thiết bị *</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DEVICE_TYPE_LABEL).map(
                            ([val, label]) => (
                              <SelectItem
                                key={val}
                                value={val}
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {dtVal === "wifi_module" ? (
                  <Controller
                    name="macAddress"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Địa chỉ MAC *</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="font-mono"
                          placeholder="AA:BB:CC:DD:EE:FF"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                ) : null}
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Trạng thái</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([val, label]) => (
                            <SelectItem
                              key={val}
                              value={val}
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật
          </Button>
        </div>
      </form>

      {actor === "admin" && isBoard && editableSubDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thiết bị con</CardTitle>
            <CardDescription>
              Chỉnh sửa nhanh các mô-đun WiFi/LoRa thuộc bo mạch này.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editableSubDevices.map((subDevice) => {
              const SubIcon = DEVICE_TYPE_ICON[subDevice.deviceType] ?? Cpu;
              const showMacField = subDevice.deviceType === "wifi_module";

              return (
                <div
                  key={subDevice.id}
                  className="rounded-lg border bg-muted/10 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SubIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">
                        {DEVICE_TYPE_LABEL[subDevice.deviceType] ??
                          subDevice.deviceType}
                      </p>
                      <Badge variant="outline">{subDevice.id.slice(0, 8)}...</Badge>
                    </div>
                    <Button
                      size="sm"
                      disabled={
                        subDevice.isSaving ||
                        !subDevice.isDirty ||
                        !subDevice.deviceName.trim()
                      }
                      onClick={() => void saveSubDevice(subDevice.id)}
                    >
                      {subDevice.isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Lưu thiết bị con
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Tên thiết bị con</FieldLabel>
                      <Input
                        value={subDevice.deviceName}
                        onChange={(e) =>
                          patchSubDevice(subDevice.id, {
                            deviceName: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Trạng thái</FieldLabel>
                      <Select
                        value={subDevice.status}
                        onValueChange={(value) =>
                          patchSubDevice(subDevice.id, {
                            status: value as z.infer<typeof DeviceStatusSchema>,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([val, label]) => (
                            <SelectItem
                              key={val}
                              value={val}
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {showMacField ? (
                    <Field>
                      <FieldLabel>Địa chỉ MAC</FieldLabel>
                      <Input
                        className="font-mono"
                        placeholder="AA:BB:CC:DD:EE:FF"
                        value={subDevice.macAddress}
                        onChange={(e) =>
                          patchSubDevice(subDevice.id, {
                            macAddress: e.target.value,
                          })
                        }
                      />
                    </Field>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {isBoard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cảm biến trên bo mạch ({existingSensors.length}/4)</CardTitle>
                <CardDescription>
                  {remainingSensorSlots > 0
                    ? `Còn ${remainingSensorSlots} vị trí trống. Mỗi loại cảm biến chỉ được gắn 1 lần.`
                    : "Bo mạch đã đủ 4 cảm biến."}
                </CardDescription>
              </div>
              {!showSensorForm && remainingSensorSlots > 0 && !device.sensorsLockedAt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const defaultType = SENSOR_TYPE_VALUES.find((t) => !existingSensorTypes.has(t)) ?? "soil_moisture";
                    sensorForm.reset({ items: [{ sensorType: defaultType, minValue: 0, maxValue: 100 }] });
                    setShowSensorForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm cảm biến
                </Button>
              )}
            </div>
          </CardHeader>

          {existingSensors.length > 0 && (
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {existingSensors.map((sensor, i) => {
                  const SIcon = SENSOR_TYPE_ICON[sensor.sensorType] ?? Cpu;
                  const label = SENSOR_TYPE_LABEL[sensor.sensorType] ?? sensor.sensorType;
                  const statusLabel = "status" in sensor
                    ? ({ active: "Hoạt động", inactive: "Tắt", calibrating: "Hiệu chuẩn" }[(sensor as { status: string }).status] ?? (sensor as { status: string }).status)
                    : null;
                  return (
                    <div key={i} className="rounded-lg border bg-background p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <SIcon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </span>
                        {statusLabel && <Badge variant="outline">{statusLabel}</Badge>}
                      </div>
                      {"minValue" in sensor && "maxValue" in sensor && (
                        <div className="text-xs text-muted-foreground">
                          Nhỏ nhất: {(sensor as { minValue: number }).minValue} | Lớn nhất: {(sensor as { maxValue: number }).maxValue}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}

          {showSensorForm && !device.sensorsLockedAt && (
            <CardContent>
              <SensorTemplatePicker actor={actor} onApply={applySensorTemplate} />
              <form onSubmit={sensorForm.handleSubmit(onSensorSubmit)} className="mt-3">
                <div className="space-y-3">
                  {(sensorForm.formState.errors.items as { message?: string } | undefined)?.message && (
                    <p className="text-sm text-destructive">
                      {(sensorForm.formState.errors.items as { message?: string }).message}
                    </p>
                  )}
                  {sensorFields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border bg-muted/10 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
                        {sensorFields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSensor(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Controller
                          name={`items.${index}.sensorType`}
                          control={sensorForm.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Loại cảm biến *</FieldLabel>
                              <Select value={f.value} onValueChange={f.onChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(SENSOR_TYPE_LABEL).map(([val, label]) => (
                                    <SelectItem key={val} value={val} disabled={existingSensorTypes.has(val) || currentSensorItems.some((item, idx) => idx !== index && item?.sensorType === val)}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </Field>
                          )}
                        />
                        <Controller
                          name={`items.${index}.minValue`}
                          control={sensorForm.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Giá trị tối thiểu *</FieldLabel>
                              <Input type="number" step="any" {...f} onChange={(e) => f.onChange(e.target.valueAsNumber)} />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </Field>
                          )}
                        />
                        <Controller
                          name={`items.${index}.maxValue`}
                          control={sensorForm.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Giá trị tối đa *</FieldLabel>
                              <Input type="number" step="any" {...f} onChange={(e) => f.onChange(e.target.valueAsNumber)} />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  {sensorFields.length < remainingSensorSlots && (
                    <Button
                      type="button" variant="outline" size="sm" className="w-full"
                      onClick={() => {
                        const usedInForm = new Set(currentSensorItems.map((item) => item?.sensorType).filter(Boolean));
                        const next = SENSOR_TYPE_VALUES.find((type) => !existingSensorTypes.has(type) && !usedInForm.has(type));
                        if (next) appendSensor({ sensorType: next, minValue: 0, maxValue: 100 });
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm cảm biến
                    </Button>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={() => {
                        const defaultType = SENSOR_TYPE_VALUES.find((t) => !existingSensorTypes.has(t)) ?? "soil_moisture";
                        setShowSensorForm(false);
                        sensorForm.clearErrors("items");
                        sensorForm.reset({ items: [{ sensorType: defaultType, minValue: 0, maxValue: 100 }] });
                      }}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" size="sm" disabled={sensorsPending}>
                      {sensorsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Tạo {sensorFields.length} cảm biến
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmSave}
        title="Cập nhật thiết bị IoT?"
        description="Thay đổi cấu hình thiết bị có thể ảnh hưởng đến hoạt động giám sát."
        confirmLabel="Cập nhật"
        cancelLabel="Hủy"
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false);
          if (pendingData) {
            void doSave(pendingData);
          }
        }}
      />
    </div>
  );
}
