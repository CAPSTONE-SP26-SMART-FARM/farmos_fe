import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Cpu, Loader2, Plus } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminCreateIotDeviceBatch } from "@/queries/useIotDevice";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  type IotDeviceResType,
  type IotDeviceTypeSchema,
} from "@/schemaValidatation/iotDevice";
import type { IotDeviceTemplateResType } from "@/schemaValidatation/iotTemplate";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { DeviceItemCard } from "./DeviceItemCard";
import {
  BatchCreateFormSchema,
  type BatchCreateFormType,
} from "./schemas";

export function BatchCreateForm({
  show,
  handleBack,
  onCreated,
  hideStatus,
}: {
  show: boolean;
  handleBack: () => void;
  onCreated?: (devices: IotDeviceResType[]) => void;
  hideStatus?: boolean;
}) {
  const adminCreateMutation = useAdminCreateIotDeviceBatch();
  const isPending = adminCreateMutation.isPending;

  const form = useForm<BatchCreateFormType>({
    resolver: zodResolver(BatchCreateFormSchema),
    defaultValues: {
      devices: [
        {
          deviceName: "",
          deviceType: "board_module",
          macAddress: "",
          status: "available",
        },
        {
          deviceName: "",
          deviceType: "lora_module",
          macAddress: "",
          status: "available",
        },
        {
          deviceName: "",
          deviceType: "wifi_module",
          macAddress: "",
          status: "available",
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
      const result = await adminCreateMutation.mutateAsync({
        farmId: undefined,
        body: {
          devices: data.devices.map((d) => ({
            ...d,
            deviceName: d.deviceName.trim(),
            macAddress: d.macAddress
              ? d.macAddress.toUpperCase()
              : d.macAddress,
          })),
        },
      });
      if (onCreated) {
        onCreated(result.data ?? []);
        return;
      }
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
                Thêm ít nhất 3 thiết bị: đúng 1 vi xử lý, ít nhất 1 mô-đun LoRa,
                ít nhất 1 mô-đun WiFi.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={boardCount === 1 ? "default" : "destructive"}
                  className="text-xs"
                >
                  Vi xử lý: {boardCount}/1
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
                  hideStatus={hideStatus}
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
                      status: "available",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm vi xử lý
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      deviceName: "",
                      deviceType: "lora_module",
                      macAddress: "",
                      status: "available",
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
                      status: "available",
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
