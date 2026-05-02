import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import {
  BOARD_TYPE_LABEL_VI,
  CreateIotKitBodySchema,
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
  type CreateIotKitBodyType,
  type IotDeviceKitResType,
  type KitModuleName,
  type IotKitSensorType,
} from "@/schemaValidatation/iotKit";
import {
  useAdminCreateIotKit,
  useAdminUpdateIotKit,
} from "@/queries/useIotKit";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  handleApiErrorUnprocessentity,
  onMutationError,
} from "@/lib/axios";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { formatCurrencyVnd } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdminIotKitFormPanelProps {
  kit?: IotDeviceKitResType;
  onBack: () => void;
}

const ALL_MODULES: KitModuleName[] = ["board", "esp32", "lora"];
const ALL_SENSORS: IotKitSensorType[] = [
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
];

export default function AdminIotKitFormPanel({
  kit,
  onBack,
}: AdminIotKitFormPanelProps) {
  const isEdit = !!kit;
  const [show, setShow] = useState(false);
  // Empty string when creating so the field is genuinely empty (avoids
  // forcing the user to clear a leading "0").
  const [priceInput, setPriceInput] = useState<string>(() =>
    kit && kit.price > 0 ? String(kit.price) : "",
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const defaultValues: CreateIotKitBodyType = useMemo(
    () => ({
      code: kit?.code ?? "",
      name: kit?.name ?? "",
      description: kit?.description ?? undefined,
      price: kit?.price ?? 0,
      boardType: kit?.boardType ?? "board_module",
      includedSensors: kit?.includedSensors ?? [...ALL_SENSORS],
      includedModules: kit?.includedModules ?? [...ALL_MODULES],
      deviceCount: kit?.deviceCount ?? 1,
      thumbnailUrl: kit?.thumbnailUrl ?? undefined,
    }),
    [kit],
  );

  const form = useForm<CreateIotKitBodyType>({
    resolver: zodResolver(CreateIotKitBodySchema),
    defaultValues,
  });
  useClearServerFieldErrors(form);

  const createMutation = useAdminCreateIotKit();
  const updateMutation = useAdminUpdateIotKit();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const watchedPrice = form.watch("price");
  const watchedBoardType = form.watch("boardType");

  const onSubmit = async (values: CreateIotKitBodyType) => {
    try {
      if (isEdit && kit) {
        const updateBody = { ...values } as Partial<CreateIotKitBodyType>;
        delete updateBody.code;
        await updateMutation.mutateAsync({ id: kit.id, data: updateBody });
        toast.success("Đã cập nhật bộ Kit IoT.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Đã tạo bộ Kit IoT mới.");
      }
      handleBack();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<CreateIotKitBodyType>(error)) {
        handleApiErrorUnprocessentity<CreateIotKitBodyType>(
          error.response?.data?.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      onMutationError(error, "Lưu bộ Kit thất bại.");
    }
  };

  return (
    <div
      className={cn(
        "space-y-6 transition-all duration-300 ease-out",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Button>
        <Badge className="mb-2">Cổng quản trị</Badge>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {isEdit ? "Cập nhật bộ Kit IoT" : "Tạo bộ Kit IoT"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          {isEdit
            ? "Một số trường (mã, số bộ, loại board) bị khoá khi đã có đơn đã thanh toán."
            : "Mỗi bộ Kit IoT mặc định gồm 1 board chính + 3 module truyền dẫn + 4 cảm biến."}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bộ Kit</CardTitle>
          <CardDescription>
            Mã, tên, giá và cấu hình thiết bị mà Owner sẽ thấy ở marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-6"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="kit-code">Mã bộ Kit *</FieldLabel>
                <Input
                  id="kit-code"
                  {...form.register("code")}
                  disabled={isEdit}
                  placeholder="VD: KIT-PACK-03"
                />
                <FieldDescription>
                  Chữ HOA, số, gạch dưới hoặc gạch ngang. Không sửa được sau khi
                  tạo.
                </FieldDescription>
                <FieldError errors={[form.formState.errors.code]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kit-name">Tên hiển thị *</FieldLabel>
                <Input
                  id="kit-name"
                  {...form.register("name")}
                  placeholder="VD: Bộ Kit IoT - 3 board"
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kit-description">Mô tả</FieldLabel>
                <Textarea
                  id="kit-description"
                  rows={3}
                  {...form.register("description")}
                  placeholder="Mô tả chi tiết bộ kit, ưu điểm, tình huống sử dụng..."
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kit-price">Giá (VND) *</FieldLabel>
                <Input
                  id="kit-price"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPriceInput(digits);
                    form.setValue("price", digits ? Number(digits) : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder="VD: 2500000"
                />
                <FieldDescription>
                  Hiển thị: {formatCurrencyVnd(watchedPrice ?? 0)}
                </FieldDescription>
                <FieldError errors={[form.formState.errors.price]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kit-board-type">Loại board *</FieldLabel>
                <Input
                  id="kit-board-type"
                  value={
                    BOARD_TYPE_LABEL_VI[watchedBoardType] ?? watchedBoardType
                  }
                  disabled
                  readOnly
                />
                <FieldDescription>
                  Hiện chỉ hỗ trợ <strong>board_module</strong>.
                </FieldDescription>
              </Field>

              <Controller
                control={form.control}
                name="includedModules"
                render={({ field, fieldState }) => {
                  const value = field.value ?? [];
                  return (
                    <Field>
                      <FieldLabel>Module bao gồm</FieldLabel>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {ALL_MODULES.map((m) => {
                          const checked = value.includes(m);
                          return (
                            <label
                              key={m}
                              className="flex cursor-pointer items-center gap-2 rounded-md border bg-background p-3 text-sm hover:bg-muted/50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...value, m]
                                    : value.filter((x) => x !== m);
                                  field.onChange(next);
                                }}
                                className="h-4 w-4 accent-primary"
                              />
                              <span>{KIT_MODULE_LABEL_VI[m]}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  );
                }}
              />

              <Controller
                control={form.control}
                name="includedSensors"
                render={({ field, fieldState }) => {
                  const value = field.value ?? [];
                  return (
                    <Field>
                      <FieldLabel>Cảm biến bao gồm</FieldLabel>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ALL_SENSORS.map((s) => {
                          const checked = value.includes(s);
                          return (
                            <label
                              key={s}
                              className="flex cursor-pointer items-center gap-2 rounded-md border bg-background p-3 text-sm hover:bg-muted/50"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...value, s]
                                    : value.filter((x) => x !== s);
                                  field.onChange(next);
                                }}
                                className="h-4 w-4 accent-primary"
                              />
                              <span>{SENSOR_TYPE_LABEL_VI[s]}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  );
                }}
              />

              <Field>
                <FieldLabel htmlFor="kit-device-count">
                  Số bộ trong 1 SKU *
                </FieldLabel>
                <Input
                  id="kit-device-count"
                  type="number"
                  min={1}
                  disabled={isEdit}
                  {...form.register("deviceCount", { valueAsNumber: true })}
                />
                <FieldDescription>
                  1 board chính = 1 bộ kit hoàn chỉnh = 1 slot quota. Không sửa
                  được khi đã có đơn đã thanh toán.
                </FieldDescription>
                <FieldError errors={[form.formState.errors.deviceCount]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="kit-thumbnail">Thumbnail URL</FieldLabel>
                <Input
                  id="kit-thumbnail"
                  {...form.register("thumbnailUrl")}
                  placeholder="https://..."
                />
                <FieldError errors={[form.formState.errors.thumbnailUrl]} />
              </Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isPending}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo bộ Kit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
