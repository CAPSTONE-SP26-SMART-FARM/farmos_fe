import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useUpsertSystemConfig,
  useWithdrawalSystemConfigs,
} from "@/queries/useSystemConfig";
import {
  WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP,
  WithdrawalSystemConfigFormSchema,
  type SystemConfigItemType,
  type WithdrawalSystemConfigFormKey,
  type WithdrawalSystemConfigFormType,
} from "@/schemaValidatation/systemConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Loader2,
  Lock,
  Pencil,
  Save,
  Undo2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  useWatch,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";

// ── Page Admin — Cấu hình rút tiền bác sĩ ────────────────────────────────
// 3 withdrawal key (xem WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP). BE endpoint
// single-key upsert (`PATCH /admin/system-configs/:key`); FE gọi tuần tự,
// chỉ key đã đổi.

interface FieldDef {
  key: WithdrawalSystemConfigFormKey;
  label: string;
  unit: string;
  helperText?: string;
  step?: number;
  /** Format helper text dựa trên giá trị hiện tại (vd "24 giờ ≈ 1 ngày"). */
  liveHelper?: (value: number) => string;
}

const vndFormatter = new Intl.NumberFormat("vi-VN");

function formatVndHuman(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `≈ ${vndFormatter.format(amount)}đ`;
}

function formatHoursHuman(h: number): string {
  if (!Number.isFinite(h) || h <= 0) return "";
  if (h < 24) return "";
  return `≈ ${(h / 24).toFixed(h % 24 === 0 ? 0 : 1)} ngày`;
}

const GROUP_AMOUNT: FieldDef[] = [
  {
    key: "min_amount",
    label: "Số tiền tối thiểu mỗi lần rút",
    unit: "đ",
    helperText:
      "Bác sĩ chỉ được tạo yêu cầu rút khi số dư đạt từ mức này trở lên.",
    liveHelper: formatVndHuman,
  },
  {
    key: "max_amount",
    label: "Số tiền tối đa mỗi lần rút",
    unit: "đ",
    helperText:
      "Mỗi yêu cầu rút không được vượt quá mức này. Phải lớn hơn hoặc bằng số tiền tối thiểu.",
    liveHelper: formatVndHuman,
  },
];

const GROUP_COOLDOWN: FieldDef[] = [
  {
    key: "not_received_cooldown_hours",
    label: "Thời gian chờ báo chưa nhận tiền",
    unit: "giờ",
    helperText:
      "Sau khi yêu cầu được duyệt, bác sĩ phải chờ hết khoảng thời gian này mới được báo cáo chưa nhận được tiền.",
    liveHelper: formatHoursHuman,
  },
];

// Helper: lookup BE config item theo FE form key.
function findConfigItem(
  items: SystemConfigItemType[] | undefined,
  formKey: WithdrawalSystemConfigFormKey,
): SystemConfigItemType | undefined {
  const beKey = WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP[formKey];
  return items?.find((x) => x.key === beKey);
}

function buildDefaultsFromConfigs(
  items: SystemConfigItemType[] | undefined,
): Partial<WithdrawalSystemConfigFormType> {
  const result: Partial<WithdrawalSystemConfigFormType> = {};
  (
    Object.keys(
      WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP,
    ) as WithdrawalSystemConfigFormKey[]
  ).forEach((formKey) => {
    const item = findConfigItem(items, formKey);
    if (item) {
      const num = Number(item.value);
      if (!Number.isNaN(num)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[formKey] = num;
      }
    }
  });
  return result;
}

function NumberField({
  field,
  register,
  errors,
  readOnly,
  currentValue,
}: {
  field: FieldDef;
  register: UseFormRegister<WithdrawalSystemConfigFormType>;
  errors: Partial<Record<WithdrawalSystemConfigFormKey, { message?: string }>>;
  readOnly: boolean;
  currentValue?: number;
}) {
  const inputId = `cfg-${field.key}`;
  const err = errors[field.key];
  const liveText =
    field.liveHelper && typeof currentValue === "number"
      ? field.liveHelper(currentValue)
      : "";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{field.label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type="number"
          step={field.step ?? 1}
          disabled={readOnly}
          {...register(field.key as Path<WithdrawalSystemConfigFormType>, {
            valueAsNumber: true,
          })}
          aria-invalid={Boolean(err)}
          className="pr-16"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
          {field.unit}
        </span>
      </div>
      {err?.message ? (
        <p className="text-destructive text-xs">{err.message}</p>
      ) : (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {field.helperText && <p>{field.helperText}</p>}
          {liveText && <p className="font-medium">{liveText}</p>}
        </div>
      )}
    </div>
  );
}

export default function AdminWithdrawalSystemConfigsPage() {
  const configsQuery = useWithdrawalSystemConfigs();
  const upsertMutation = useUpsertSystemConfig();

  const items = configsQuery.data?.data?.data;

  // Mặc định trang ở chế độ XEM (read-only). Bấm "Chỉnh sửa" mới mở form.
  const [isEditing, setIsEditing] = useState(false);

  const defaultValues = useMemo(() => buildDefaultsFromConfigs(items), [items]);

  const form = useForm<WithdrawalSystemConfigFormType>({
    resolver: zodResolver(WithdrawalSystemConfigFormSchema),
    defaultValues: defaultValues as WithdrawalSystemConfigFormType,
  });
  useClearServerFieldErrors(form);

  useEffect(() => {
    if (items) {
      form.reset(defaultValues as WithdrawalSystemConfigFormType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = form;

  const watchedValues = useWatch({ control });

  const isPending = upsertMutation.isPending || isSubmitting;
  const readOnly = !isEditing;

  const onSubmit = async (data: WithdrawalSystemConfigFormType) => {
    const keysToUpdate = (
      Object.keys(
        WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP,
      ) as WithdrawalSystemConfigFormKey[]
    ).filter((k) => dirtyFields[k]);

    if (keysToUpdate.length === 0) {
      toast.info("Không có thay đổi nào để lưu.");
      return;
    }

    let successCount = 0;
    const failures: { key: string; message: string }[] = [];

    for (const formKey of keysToUpdate) {
      const beKey = WITHDRAWAL_SYSTEM_CONFIG_KEY_MAP[formKey];
      const oldItem = findConfigItem(items, formKey);
      try {
        await upsertMutation.mutateAsync({
          key: beKey,
          body: {
            value: String(data[formKey]),
            valueType:
              (oldItem?.valueType as
                | "number"
                | "boolean"
                | "string"
                | "json") ?? "number",
            description: oldItem?.description ?? null,
          },
        });
        successCount++;
      } catch (error) {
        failures.push({
          key: beKey,
          message: getApiErrorMessageVi(error),
        });
      }
    }

    if (failures.length === 0) {
      toast.success(`Đã cập nhật ${successCount} cấu hình.`);
      setIsEditing(false);
    } else if (successCount === 0) {
      toast.error(
        `Cập nhật thất bại. ${failures[0].key}: ${failures[0].message}`,
      );
    } else {
      toast.warning(
        `Đã cập nhật ${successCount}/${keysToUpdate.length} cấu hình. Có ${failures.length} key lỗi.`,
      );
      failures.forEach((f) =>
        console.warn(`[system-config] ${f.key}: ${f.message}`),
      );
    }
  };

  const handleResetToServer = () => {
    reset(defaultValues as WithdrawalSystemConfigFormType);
    toast.info("Đã khôi phục về giá trị đang lưu trên hệ thống.");
  };

  const handleEnterEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    reset(defaultValues as WithdrawalSystemConfigFormType);
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cấu Hình Rút Tiền Bác Sĩ
          </CardTitle>
          <CardDescription>
            Quản lý hạn mức và thời gian chờ cho yêu cầu rút tiền của bác sĩ. Thay
            đổi áp dụng ngay cho yêu cầu rút mới; yêu cầu đang xử lý vẫn theo
            cấu hình tại thời điểm tạo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full"
                />
              ))}
            </div>
          ) : configsQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không tải được cấu hình</AlertTitle>
              <AlertDescription>
                {getApiErrorMessageVi(configsQuery.error)}
              </AlertDescription>
            </Alert>
          ) : !items || items.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chưa có cấu hình rút tiền</AlertTitle>
              <AlertDescription>
                Hệ thống chưa khởi tạo các cấu hình mặc định cho rút tiền. Vui
                lòng liên hệ kỹ thuật để chạy seed dữ liệu.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {readOnly ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle className="text-sm font-semibold">
                    Chế độ xem
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Đang hiển thị giá trị đang được áp dụng trên hệ thống. Bấm
                    "Chỉnh sửa" để thay đổi.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-amber-200 bg-amber-500/10">
                  <Pencil className="h-4 w-4 text-amber-700" />
                  <AlertTitle className="text-sm font-semibold text-amber-900">
                    Đang chỉnh sửa
                  </AlertTitle>
                  <AlertDescription className="text-xs text-amber-900/80">
                    Sau khi lưu, các giá trị mới sẽ áp dụng cho yêu cầu rút tiền
                    được tạo sau thời điểm này. Yêu cầu đang xử lý vẫn dùng giá
                    trị cũ.
                  </AlertDescription>
                </Alert>
              )}

              {/* Group 1: Hạn mức */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold mb-2">
                  Hạn mức số tiền
                </legend>
                <div className="grid gap-4 md:grid-cols-2">
                  {GROUP_AMOUNT.map((field) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                      readOnly={readOnly}
                      currentValue={
                        watchedValues[field.key] as number | undefined
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <Separator />

              {/* Group 2: Cooldown */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold mb-2">
                  Thời gian chờ khiếu nại
                </legend>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Sau khi admin duyệt yêu cầu rút tiền, bác sĩ phải chờ hết
                    khoảng thời gian này mới được phép báo "chưa nhận tiền" để
                    đối soát lại. Thời gian chờ ngắn giúp xử lý nhanh nhưng dễ
                    tạo khiếu nại sớm khi ngân hàng chưa kịp chuyển.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4 md:grid-cols-2">
                  {GROUP_COOLDOWN.map((field) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                      readOnly={readOnly}
                      currentValue={
                        watchedValues[field.key] as number | undefined
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <Separator />

              <div className="flex items-center justify-end gap-2">
                {readOnly ? (
                  <Button
                    type="button"
                    onClick={handleEnterEdit}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetToServer}
                      disabled={isPending || !isDirty}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Khôi phục
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending || !isDirty}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Lưu cấu hình
                    </Button>
                  </>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
