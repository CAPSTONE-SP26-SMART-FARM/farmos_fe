import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CircuitBoard,
  Cpu,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminCreateSensorBatch } from "@/queries/useIotDevice";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  SENSOR_DEFAULT_RANGE,
  SENSOR_TYPE_VALUES,
  SensorBatchSchema,
  type SensorBatchFormType,
} from "./sensorBatchSchema";
import { SensorRowFields } from "./SensorRowFields";
import { CreateSensorsConfirm } from "./CreateSensorsConfirm";

interface Props {
  board: IotDeviceResType | undefined;
  onGoBack: () => void;
  onDone: () => void;
}

export function SensorStep({ board, onGoBack, onDone }: Props) {
  const createMutation = useAdminCreateSensorBatch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<
    SensorBatchFormType["items"] | null
  >(null);

  const form = useForm<SensorBatchFormType>({
    resolver: zodResolver(SensorBatchSchema),
    defaultValues: {
      items: [
        {
          sensorType: "soil_moisture",
          minValue: SENSOR_DEFAULT_RANGE.soil_moisture.min,
          maxValue: SENSOR_DEFAULT_RANGE.soil_moisture.max,
        },
      ],
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
          <CardTitle>Không tìm thấy vi xử lý</CardTitle>
          <CardDescription>
            Lô thiết bị vừa tạo không có vi xử lý nào để gắn cảm biến.
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
    setConfirmOpen(true);
  };

  const doCreateSensors = async () => {
    if (!pendingItems) return;
    try {
      await createMutation.mutateAsync({
        deviceId: board.id,
        body: { items: pendingItems },
      });
      setConfirmOpen(false);
      setPendingItems(null);
      toast.success("Bộ kit IoT mới đã được tạo thành công");
      onDone();
    } catch (error) {
      setConfirmOpen(false);
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

  const handleAddSensor = () => {
    const used = new Set(watched.map((item) => item?.sensorType).filter(Boolean));
    const nextType = SENSOR_TYPE_VALUES.find((t) => !used.has(t));
    if (!nextType) return;
    const range = SENSOR_DEFAULT_RANGE[nextType];
    append({
      sensorType: nextType,
      minValue: range.min,
      maxValue: range.max,
    });
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onValidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircuitBoard className="h-5 w-5 text-primary" />
              Gắn cảm biến cho vi xử lý
            </CardTitle>
            <CardDescription>
              Vi xử lý:{" "}
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
              <SensorRowFields
                key={field.id}
                index={index}
                control={form.control}
                watchedItems={watched}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}

            {fields.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddSensor}
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
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Cpu className="mr-2 h-4 w-4" />
                Tạo {fields.length} cảm biến
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <CreateSensorsConfirm
        open={confirmOpen}
        items={pendingItems}
        isPending={isPending}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingItems(null);
        }}
        onConfirm={() => void doCreateSensors()}
      />
    </>
  );
}
