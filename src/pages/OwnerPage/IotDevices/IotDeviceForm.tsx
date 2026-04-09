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
  Eye,
  Check,
  Info,
  Droplets,
  Thermometer,
  CloudRain,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useOwnerCreateIotDevices,
  useOwnerUpdateIotDevice,
} from "@/queries/useIotDevice";
import { useOwnerCreateSensors } from "@/queries/useSensor";
import {
  useOwnerListIotDeviceTemplates,
  useOwnerIotDeviceTemplateDetail,
  useOwnerListSensorTemplates,
  useOwnerSensorTemplateDetail,
} from "@/queries/useIotTemplate";
import {
  DeviceStatusSchema,
  IotDeviceTypeSchema,
  type IotDeviceResType,
  type UpdateIotDeviceBodyType,
} from "@/schemaValidatation/iotDevice";
import { SensorTypeSchema } from "@/schemaValidatation/sensor";
import type {
  IotDeviceTemplateResType,
  SensorTemplateResType,
} from "@/schemaValidatation/iotTemplate";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";

// ── Form schemas ───────────────────────────────────────────────────────

const DeviceItemFormSchema = z
  .object({
    deviceName: z.string().min(1, "Tên thiết bị là bắt buộc").max(255),
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
        message: "MAC address là bắt buộc cho WiFi Module",
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
        message: `Phải có đúng 1 Board Module (hiện có ${boardCount})`,
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

const EditFormSchema = z.object({
  deviceName: z.string().min(1, "Tên thiết bị là bắt buộc").max(255),
  deviceType: IotDeviceTypeSchema,
  macAddress: z
    .string()
    .max(17)
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      "Định dạng MAC không hợp lệ",
    )
    .nullable()
    .or(z.literal("")),
  status: DeviceStatusSchema,
});

// Sensor batch form for adding sensors to a board
const SensorItemFormSchema = z.object({
  sensorType: SensorTypeSchema,
  minValue: z.number(),
  maxValue: z.number(),
});

const SensorBatchFormSchema = z.object({
  items: z.array(SensorItemFormSchema).min(1, "Cần ít nhất 1 cảm biến"),
});

type BatchCreateFormType = z.infer<typeof BatchCreateFormSchema>;
type EditFormType = z.infer<typeof EditFormSchema>;
type SensorBatchFormType = z.infer<typeof SensorBatchFormSchema>;

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Board Module",
  lora_module: "LoRa Module",
  wifi_module: "WiFi Module",
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
  decommissioned: "Ngưng hoạt động",
};

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

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
  onApply,
}: {
  onApply: (template: IotDeviceTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { data: templatesRes, isLoading } = useOwnerListIotDeviceTemplates({
    page: 1,
    limit: 50,
  });
  const { data: detailRes } = useOwnerIotDeviceTemplateDetail(
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
      <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Áp dụng từ Template</CardTitle>
            <Badge
              variant="outline"
              className="text-xs font-normal"
            >
              Tùy chọn
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Chọn template để tự động điền tên và loại thiết bị. Bạn vẫn có thể
            chỉnh sửa sau khi áp dụng.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => {
              const TIcon = DEVICE_TYPE_ICON[t.type] ?? Cpu;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onApply(t)}
                  >
                    <TIcon className="h-3.5 w-3.5" />
                    {t.name}
                    <span className="text-muted-foreground">
                      ({t.items.length} thiết bị)
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setPreviewId(t.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Sheet
        open={!!previewId}
        onOpenChange={() => setPreviewId(null)}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Chi tiết Template
            </SheetTitle>
            <SheetDescription>
              Xem cấu hình mẫu trước khi áp dụng.
            </SheetDescription>
          </SheetHeader>

          {detail ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-2">
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
                <h4 className="text-sm font-medium">
                  Danh sách thiết bị ({detail.items.length})
                </h4>
                {detail.items.map((item, i) => {
                  const IIcon = DEVICE_TYPE_ICON[item.deviceType] ?? Cpu;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md border p-2.5"
                    >
                      <IIcon className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.deviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {DEVICE_TYPE_LABEL[item.deviceType] ??
                            item.deviceType}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0"
                      >
                        #{i + 1}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Template chỉ gợi ý giá trị ban đầu. Tất cả các trường đều có
                  thể chỉnh sửa sau khi áp dụng.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  onApply(detail);
                  setPreviewId(null);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Áp dụng Template này
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
  onApply,
}: {
  onApply: (template: SensorTemplateResType) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { data: templatesRes, isLoading } = useOwnerListSensorTemplates({
    page: 1,
    limit: 50,
  });
  const { data: detailRes } = useOwnerSensorTemplateDetail(
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
      <div className="rounded-md border border-dashed border-primary/30 bg-primary/[0.02] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">
            Áp dụng từ Sensor Template
          </span>
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
              <div
                key={t.id}
                className="flex items-center gap-0.5"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px] px-2"
                  onClick={() => onApply(t)}
                >
                  <SIcon className="h-3 w-3" />
                  {t.name}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => setPreviewId(t.id)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Sheet
        open={!!previewId}
        onOpenChange={() => setPreviewId(null)}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Chi tiết Sensor Template
            </SheetTitle>
            <SheetDescription>
              Xem cấu hình cảm biến mẫu trước khi áp dụng.
            </SheetDescription>
          </SheetHeader>

          {detail ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="space-y-2">
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
                <h4 className="text-sm font-medium">
                  Cảm biến mẫu ({detail.items.length})
                </h4>
                {detail.items.map((item) => {
                  const IIcon = SENSOR_TYPE_ICON[item.sensorType] ?? Cpu;
                  return (
                    <div
                      key={item.id}
                      className="rounded-md border p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <IIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {item.sensorModel ??
                            SENSOR_TEMPLATE_TYPE_LABEL[item.sensorType] ??
                            item.sensorType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {item.minValue != null && (
                          <span>Min: {item.minValue}</span>
                        )}
                        {item.maxValue != null && (
                          <span>Max: {item.maxValue}</span>
                        )}
                        {item.optimalMin != null && (
                          <span>Optimal Min: {item.optimalMin}</span>
                        )}
                        {item.optimalMax != null && (
                          <span>Optimal Max: {item.optimalMax}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Sensor Template sẽ điền sẵn loại cảm biến và các giá trị
                  ngưỡng. Bạn vẫn có thể chỉnh sửa.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  onApply(detail);
                  setPreviewId(null);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Áp dụng Template này
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
  device?: IotDeviceResType;
  onBack: () => void;
}

export default function IotDeviceForm({
  farmId,
  device,
  onBack,
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
      show={show}
      handleBack={handleBack}
    />
  );
}

// ── Device item card (batch create) ────────────────────────────────────

function DeviceItemCard({
  index,
  control,
  canRemove,
  onRemove,
}: {
  index: number;
  control: import("react-hook-form").Control<BatchCreateFormType>;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const dtVal = useWatch({ control, name: `devices.${index}.deviceType` });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;
  const showMac = dtVal === "wifi_module";

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
                    placeholder="VD: Main Board - Farm A"
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
                      {Object.entries(DEVICE_TYPE_LABEL).map(([val, label]) => (
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

          <div className="grid gap-3 md:grid-cols-2">
            {showMac && (
              <Controller
                name={`devices.${index}.macAddress`}
                control={control}
                render={({ field: f, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>MAC Address *</FieldLabel>
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
  show,
  handleBack,
}: {
  farmId: string;
  show: boolean;
  handleBack: () => void;
}) {
  const { mutateAsync: createAsync, isPending } = useOwnerCreateIotDevices();

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

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "devices",
  });

  const [confirmTemplate, setConfirmTemplate] = useState(false);
  const [pendingTemplate, setPendingTemplate] =
    useState<IotDeviceTemplateResType | null>(null);

  const applyDeviceTemplate = (template: IotDeviceTemplateResType) => {
    const hasUserInput = form
      .getValues("devices")
      .some((d) => d.deviceName.trim() !== "");
    if (hasUserInput) {
      setPendingTemplate(template);
      setConfirmTemplate(true);
      return;
    }
    doApplyDeviceTemplate(template);
  };

  const doApplyDeviceTemplate = (template: IotDeviceTemplateResType) => {
    const mapped = template.items.map((item) => ({
      deviceName: item.deviceName,
      deviceType: (item.deviceType ?? template.type) as z.infer<
        typeof IotDeviceTypeSchema
      >,
      macAddress: "",
      status: "active" as const,
    }));

    // Ensure minimum 3 devices with all 3 types
    const types = new Set(mapped.map((d) => d.deviceType));
    const allTypes: z.infer<typeof IotDeviceTypeSchema>[] = [
      "board_module",
      "lora_module",
      "wifi_module",
    ];
    for (const t of allTypes) {
      if (!types.has(t)) {
        mapped.push({
          deviceName: "",
          deviceType: t,
          macAddress: "",
          status: "active",
        });
      }
    }

    replace(mapped);
  };

  const onSubmit = async (data: BatchCreateFormType) => {
    try {
      await createAsync({
        farmId,
        body: {
          devices: data.devices.map((d) => ({
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            ...(d.macAddress ? { macAddress: d.macAddress } : {}),
            status: d.status,
          })),
        },
      });
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
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
          Batch
        </Badge>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <DeviceTemplatePicker onApply={applyDeviceTemplate} />

          <Card>
            <CardHeader>
              <CardTitle>Danh sách thiết bị</CardTitle>
              <CardDescription>
                Thêm ít nhất 3 thiết bị: đúng 1 Board Module, ít nhất 1 LoRa
                Module, ít nhất 1 WiFi Module.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rootError && (
                <p className="text-sm text-destructive">{rootError}</p>
              )}

              {fields.map((field, index) => (
                <DeviceItemCard
                  key={field.id}
                  index={index}
                  control={form.control}
                  canRemove={fields.length > 3}
                  onRemove={() => remove(index)}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
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
                Thêm thiết bị
              </Button>
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

      <ConfirmDialog
        open={confirmTemplate}
        title="Áp dụng Template?"
        description="Các thiết bị hiện tại sẽ bị ghi đè bởi cấu hình từ template. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Áp dụng"
        cancelLabel="Hủy"
        onCancel={() => {
          setConfirmTemplate(false);
          setPendingTemplate(null);
        }}
        onConfirm={() => {
          setConfirmTemplate(false);
          if (pendingTemplate) {
            doApplyDeviceTemplate(pendingTemplate);
            setPendingTemplate(null);
          }
        }}
      />
    </div>
  );
}

// ── Edit Single Device ─────────────────────────────────────────────────

function EditDeviceForm({
  farmId,
  device,
  show,
  confirmSave,
  pendingData,
  setConfirmSave,
  setPendingData,
  handleBack,
}: {
  farmId: string;
  device: IotDeviceResType;
  show: boolean;
  confirmSave: boolean;
  pendingData: EditFormType | null;
  setConfirmSave: (v: boolean) => void;
  setPendingData: (v: EditFormType | null) => void;
  handleBack: () => void;
}) {
  const { mutateAsync: updateAsync, isPending } = useOwnerUpdateIotDevice();
  const { mutateAsync: createSensorsAsync, isPending: sensorsPending } =
    useOwnerCreateSensors();
  const [showSensorForm, setShowSensorForm] = useState(false);

  const isBoard = device.deviceType === "board_module";

  const form = useForm<EditFormType>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      deviceName: device.deviceName,
      deviceType: device.deviceType as z.infer<typeof IotDeviceTypeSchema>,
      macAddress: device.macAddress ?? "",
      status: device.status,
    },
  });

  const sensorForm = useForm<SensorBatchFormType>({
    resolver: zodResolver(SensorBatchFormSchema),
    defaultValues: {
      items: [{ sensorType: "soil_moisture", minValue: 0, maxValue: 100 }],
    },
  });

  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
    replace: replaceSensors,
  } = useFieldArray({ control: sensorForm.control, name: "items" });

  const SENSOR_TEMPLATE_TO_SENSOR_TYPE: Record<string, string> = {
    soil_moisture_sensor: "soil_moisture",
    air_temperature_sensor: "air_temperature",
    air_humidity_sensor: "air_humidity",
    light_intensity_sensor: "light_intensity",
  };

  const applySensorTemplate = (template: SensorTemplateResType) => {
    const mapped = template.items
      .map((item) => {
        const sensorType =
          SENSOR_TEMPLATE_TO_SENSOR_TYPE[item.sensorType] ?? item.sensorType;
        return {
          sensorType: sensorType as z.infer<typeof SensorTypeSchema>,
          minValue: item.minValue ?? 0,
          maxValue: item.maxValue ?? 100,
        };
      })
      .slice(0, 4);

    if (mapped.length > 0) {
      replaceSensors(mapped);
      setShowSensorForm(true);
    }
  };

  const doSave = async (data: EditFormType) => {
    try {
      const body: UpdateIotDeviceBodyType = {
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        macAddress: data.macAddress || null,
        status: data.status,
      };
      await updateAsync({ deviceId: device.id, farmId, body });
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
        );
      }
    }
  };

  const onValidSubmit = (data: EditFormType) => {
    setPendingData(data);
    setConfirmSave(true);
  };

  const onSensorSubmit = async (data: SensorBatchFormType) => {
    try {
      await createSensorsAsync({
        iotDeviceId: device.id,
        body: { items: data.items },
      });
      setShowSensorForm(false);
      sensorForm.reset();
    } catch {
      // error handled by mutation
    }
  };

  const dtVal = useWatch({ control: form.control, name: "deviceType" });
  const DIcon = DEVICE_TYPE_ICON[dtVal] ?? Cpu;

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
                <Controller
                  name="macAddress"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>MAC Address</FieldLabel>
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

      {/* Sensor creation for board_module */}
      {isBoard && !device.sensorsLockedAt && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Thêm cảm biến</CardTitle>
                <CardDescription>
                  Thêm cảm biến cho board module này (tối đa 4 cảm biến, mỗi
                  loại 1).
                </CardDescription>
              </div>
              {!showSensorForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSensorForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm cảm biến
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SensorTemplatePicker onApply={applySensorTemplate} />
          </CardContent>
          {showSensorForm && (
            <CardContent>
              <form onSubmit={sensorForm.handleSubmit(onSensorSubmit)}>
                <div className="space-y-3">
                  {sensorFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-lg border bg-muted/10 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Cảm biến #{index + 1}
                        </p>
                        {sensorFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeSensor(index)}
                          >
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
                              <Select
                                value={f.value}
                                onValueChange={f.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(SENSOR_TYPE_LABEL).map(
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
                              <FieldError>
                                {fieldState.error?.message}
                              </FieldError>
                            </Field>
                          )}
                        />
                        <Controller
                          name={`items.${index}.minValue`}
                          control={sensorForm.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Giá trị tối thiểu *</FieldLabel>
                              <Input
                                type="number"
                                step="any"
                                {...f}
                                onChange={(e) =>
                                  f.onChange(e.target.valueAsNumber)
                                }
                              />
                              <FieldError>
                                {fieldState.error?.message}
                              </FieldError>
                            </Field>
                          )}
                        />
                        <Controller
                          name={`items.${index}.maxValue`}
                          control={sensorForm.control}
                          render={({ field: f, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel>Giá trị tối đa *</FieldLabel>
                              <Input
                                type="number"
                                step="any"
                                {...f}
                                onChange={(e) =>
                                  f.onChange(e.target.valueAsNumber)
                                }
                              />
                              <FieldError>
                                {fieldState.error?.message}
                              </FieldError>
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  ))}

                  {sensorFields.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        appendSensor({
                          sensorType: "soil_moisture",
                          minValue: 0,
                          maxValue: 100,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm cảm biến
                    </Button>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSensorForm(false);
                        sensorForm.reset();
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={sensorsPending}
                    >
                      {sensorsPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
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
