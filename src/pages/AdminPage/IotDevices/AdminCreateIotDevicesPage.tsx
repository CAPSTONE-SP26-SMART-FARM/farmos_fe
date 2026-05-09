import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
  Check,
  CircuitBoard,
  Cpu,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import {
  useAdminCreateSensorBatch,
  useAdminDeleteIotDevice,
  useAdminIotDeviceDetail,
} from "@/queries/useIotDevice";
import { Skeleton } from "@/components/ui/skeleton";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import { SensorTypeSchema } from "@/schemaValidatation/sensor";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";

const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

const SENSOR_TYPE_VALUES = Object.keys(SENSOR_TYPE_LABEL) as Array<
  z.infer<typeof SensorTypeSchema>
>;

const SensorItemSchema = z.object({
  sensorType: SensorTypeSchema,
  minValue: z
    .number()
    .refine(Number.isFinite, "Giá trị tối thiểu không hợp lệ"),
  maxValue: z.number().refine(Number.isFinite, "Giá trị tối đa không hợp lệ"),
});

const SensorBatchSchema = z
  .object({
    items: z
      .array(SensorItemSchema)
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

type SensorBatchFormType = z.infer<typeof SensorBatchSchema>;

export default function AdminCreateIotDevicesPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdDevices, setCreatedDevices] = useState<IotDeviceResType[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const deleteMutation = useAdminDeleteIotDevice();

  const board = useMemo(
    () => createdDevices.find((d) => d.deviceType === "board_module"),
    [createdDevices],
  );

  const goToList = () => navigate("/dashboard/admin/iot-devices");

  const doCancelBatch = async () => {
    try {
      for (const d of createdDevices) {
        await deleteMutation.mutateAsync(d.id);
      }
      setConfirmCancel(false);
      goToList();
    } catch {
      setConfirmCancel(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <Badge>Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Tạo bộ thiết bị IoT
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Bước 1: tạo lô thiết bị. Bước 2: gắn cảm biến cho bo mạch.
          </p>
        </div>

        <StepIndicator step={step} />
      </section>

      {step === 1 ? (
        createdDevices.length === 0 ? (
          <IotDeviceForm
            farmId=""
            actor="admin"
            onBack={goToList}
            hideStatus
            onCreated={(devices) => {
              setCreatedDevices(devices);
              setStep(2);
            }}
          />
        ) : board ? (
          <EditBoardWithSubDevices
            boardId={board.id}
            fallback={board}
            onBack={() => setConfirmCancel(true)}
            onNext={() => setStep(2)}
          />
        ) : null
      ) : (
        <SensorStep
          board={board}
          onGoBack={() => setStep(1)}
          onDone={goToList}
        />
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Hủy lô thiết bị?"
        description={`Hành động này sẽ xóa toàn bộ ${createdDevices.length} thiết bị vừa tạo (bo mạch, WiFi, LoRa) khỏi hệ thống. Không thể khôi phục.`}
        confirmLabel={deleteMutation.isPending ? "Đang xóa..." : "Xóa lô"}
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="destructive"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void doCancelBatch()}
      />
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { id: 1 as const, label: "Tạo thiết bị" },
    { id: 2 as const, label: "Thêm cảm biến" },
  ];
  return (
    <div className="mt-4 flex items-center gap-3">
      {steps.map((s, i) => {
        const isActive = step === s.id;
        const isDone = step > s.id;
        return (
          <div
            key={s.id}
            className="flex items-center gap-3"
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : isActive
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={`text-sm ${
                isActive || isDone
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px w-8 bg-border md:w-12" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditBoardWithSubDevices({
  boardId,
  fallback,
  onBack,
  onNext,
}: {
  boardId: string;
  fallback: IotDeviceResType;
  onBack: () => void;
  onNext: () => void;
}) {
  const detailQuery = useAdminIotDeviceDetail(boardId, true);
  const detail = detailQuery.data?.data;

  if (detailQuery.isLoading && !detail) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <IotDeviceForm
      farmId=""
      actor="admin"
      device={detail ?? fallback}
      onBack={onBack}
      onBackRequested={onBack}
      hideSensors
      hideStatus
      onNext={onNext}
      nextLabel="Tiếp tục bước cảm biến"
    />
  );
}

function SensorStep({
  board,
  onGoBack,
  onDone,
}: {
  board: IotDeviceResType | undefined;
  onGoBack: () => void;
  onDone: () => void;
}) {
  const createMutation = useAdminCreateSensorBatch();
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [pendingItems, setPendingItems] = useState<
    SensorBatchFormType["items"] | null
  >(null);

  const form = useForm<SensorBatchFormType>({
    resolver: zodResolver(SensorBatchSchema),
    defaultValues: {
      items: [{ sensorType: "soil_moisture", minValue: 0, maxValue: 100 }],
    },
  });

  useClearServerFieldErrors(form);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watched = form.watch("items") ?? [];

  if (!board) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không tìm thấy bo mạch</CardTitle>
          <CardDescription>
            Lô thiết bị vừa tạo không có bo mạch nào để gắn cảm biến.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onDone}>Về danh sách thiết bị</Button>
        </CardContent>
      </Card>
    );
  }

  const onValidSubmit = (data: SensorBatchFormType) => {
    setPendingItems(data.items);
    setConfirmCreate(true);
  };

  const doCreateSensors = async () => {
    if (!pendingItems) return;
    try {
      await createMutation.mutateAsync({
        deviceId: board.id,
        body: { items: pendingItems },
      });
      setConfirmCreate(false);
      setPendingItems(null);
      toast.success("Bộ kit Iot mới đã được tạo thành công");
      onDone();
    } catch (error) {
      setConfirmCreate(false);
      if (isApiErrorUnprocessableEntityResponse<SensorBatchFormType>(error)) {
        handleApiErrorUnprocessentity<SensorBatchFormType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Tạo cảm biến thất bại");
        return;
      }
      toast.error("Đã có lỗi xảy ra");
    }
  };

  const rootError = (
    form.formState.errors.items as { message?: string } | undefined
  )?.message;

  const isPending = createMutation.isPending;

  return (
    <>
      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircuitBoard className="h-5 w-5 text-primary" />
              Gắn cảm biến cho bo mạch
            </CardTitle>
            <CardDescription>
              Bo mạch:{" "}
              <span className="font-medium text-foreground">
                {board.deviceName}
              </span>
              . Tối đa 4 cảm biến, mỗi loại 1 lần. Sau khi tạo cảm biến, cấu
              hình sẽ bị khóa và không thể chỉnh sửa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rootError && (
              <p className="text-sm text-destructive">{rootError}</p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border bg-muted/10 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Cảm biến #{index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <FieldGroup>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Controller
                      name={`items.${index}.sensorType`}
                      control={form.control}
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
                              {SENSOR_TYPE_VALUES.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  disabled={watched.some(
                                    (item, i) =>
                                      i !== index && item?.sensorType === type,
                                  )}
                                >
                                  {SENSOR_TYPE_LABEL[type]}
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
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giá trị tối thiểu *</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            {...f}
                            onChange={(e) => f.onChange(e.target.valueAsNumber)}
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                      )}
                    />
                    <Controller
                      name={`items.${index}.maxValue`}
                      control={form.control}
                      render={({ field: f, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giá trị tối đa *</FieldLabel>
                          <Input
                            type="number"
                            step="any"
                            {...f}
                            onChange={(e) => f.onChange(e.target.valueAsNumber)}
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </Field>
                      )}
                    />
                  </div>
                </FieldGroup>
              </div>
            ))}

            {fields.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const used = new Set(
                    watched.map((item) => item?.sensorType).filter(Boolean),
                  );
                  const next = SENSOR_TYPE_VALUES.find((t) => !used.has(t));
                  if (next)
                    append({
                      sensorType: next,
                      minValue: 0,
                      maxValue: 100,
                    });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm cảm biến
              </Button>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onGoBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại chỉnh sửa thiết bị
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Cpu className="mr-2 h-4 w-4" />
                Tạo {fields.length} cảm biến
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <ConfirmDialog
        open={confirmCreate}
        title="Xác nhận tạo cảm biến?"
        description="Sau khi tạo, cấu hình cảm biến của bo mạch sẽ bị khóa và bạn sẽ không thể chỉnh sửa nữa."
        confirmLabel="Tạo cảm biến"
        cancelLabel="Hủy"
        variant="default"
        onCancel={() => {
          setConfirmCreate(false);
          setPendingItems(null);
        }}
        onConfirm={() => {
          void doCreateSensors();
        }}
      />
    </>
  );
}
