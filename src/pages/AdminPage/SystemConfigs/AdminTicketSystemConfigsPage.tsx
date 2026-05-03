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
  useTicketSystemConfigs,
  useUpsertSystemConfig,
} from "@/queries/useSystemConfig";
import {
  TICKET_SYSTEM_CONFIG_KEY_MAP,
  TicketSystemConfigFormSchema,
  type SystemConfigItemType,
  type TicketSystemConfigFormKey,
  type TicketSystemConfigFormType,
} from "@/schemaValidatation/systemConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Save, Settings, Undo2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, type Path, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";

// ── Page Admin — Cấu hình quy trình ticket (B18) ─────────────────────────
// 9 ticket key prefix `ticket.`. BE endpoint single-key upsert
// (`PATCH /admin/system-configs/:key`); FE gọi tuần tự, chỉ key đã đổi.

interface FieldDef {
  key: TicketSystemConfigFormKey;
  label: string;
  unit: string;
  helperText?: string;
  step?: number;
}

const GROUP_LIFECYCLE: FieldDef[] = [
  {
    key: "auto_close_hours",
    label: "Thời gian tự đóng ticket",
    unit: "giờ",
    helperText:
      "Sau khi bác sĩ giải quyết, nếu người tạo không xác nhận trong khoảng này, hệ thống tự đóng và thanh toán hoa hồng.",
  },
  {
    key: "auto_close_notify_at_fraction",
    label: "Thời điểm gửi nhắc đóng ticket",
    unit: "tỉ lệ",
    helperText:
      "Hệ thống nhắc người tạo khi đã qua tỉ lệ này của thời gian chờ tự đóng (ví dụ 0.667 = đã qua 2/3 thời gian).",
    step: 0.001,
  },
  {
    key: "doctor_silence_minutes",
    label: "Ngưỡng im lặng của bác sĩ",
    unit: "phút",
    helperText:
      "Bác sĩ đã nhận ticket nhưng không xử lý quá thời gian này, hệ thống sẽ hỏi người tạo chuyển sang AI xử lý hoặc hoàn ticket.",
  },
  {
    key: "ai_fallback_minutes",
    label: "Thời gian chờ AI tiếp nhận",
    unit: "phút",
    helperText:
      "Sau thời gian này nếu không bác sĩ nào nhận ticket, AI sẽ tự xử lý.",
  },
];

const GROUP_PRIORITY_WINDOW: FieldDef[] = [
  {
    key: "priority_window_platinum_sec",
    label: "Cửa sổ ưu tiên Bạch kim",
    unit: "giây",
    helperText:
      "Gửi ticket đầu tiên cho bác sĩ hạng Bạch kim đang trực tuyến.",
  },
  {
    key: "priority_window_gold_sec",
    label: "Cửa sổ ưu tiên Vàng",
    unit: "giây",
    helperText:
      "Sau khoảng này, nếu chưa bác sĩ nào nhận, hệ thống mở rộng cho hạng Vàng. Phải lớn hơn hoặc bằng cửa sổ Bạch kim.",
  },
  {
    key: "priority_window_fanout_sec",
    label: "Mở cho toàn bộ bác sĩ",
    unit: "giây",
    helperText:
      "Sau khoảng này, hệ thống gửi cho tất cả bác sĩ trực tuyến (kể cả Bạc và Đồng). Phải lớn hơn hoặc bằng cửa sổ Vàng.",
  },
];

const GROUP_COMMISSION: FieldDef[] = [
  {
    key: "commission_max_percent",
    label: "Trần hoa hồng",
    unit: "%",
    helperText: "Giới hạn % hoa hồng tối đa cho mọi quy tắc.",
    step: 0.5,
  },
  {
    key: "rating_max_stars",
    label: "Thang điểm đánh giá",
    unit: "sao",
    helperText: "Số sao tối đa người tạo có thể chấm cho bác sĩ.",
  },
];

// Helper: lookup BE config item theo FE form key.
function findConfigItem(
  items: SystemConfigItemType[] | undefined,
  formKey: TicketSystemConfigFormKey,
): SystemConfigItemType | undefined {
  const beKey = TICKET_SYSTEM_CONFIG_KEY_MAP[formKey];
  return items?.find((x) => x.key === beKey);
}

function buildDefaultsFromConfigs(
  items: SystemConfigItemType[] | undefined,
): Partial<TicketSystemConfigFormType> {
  const result: Partial<TicketSystemConfigFormType> = {};
  (
    Object.keys(TICKET_SYSTEM_CONFIG_KEY_MAP) as TicketSystemConfigFormKey[]
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

// Render 1 field number với suffix unit (pattern từ AdminTicketCategoriesPage).
function NumberField({
  field,
  register,
  errors,
}: {
  field: FieldDef;
  register: UseFormRegister<TicketSystemConfigFormType>;
  errors: Partial<Record<TicketSystemConfigFormKey, { message?: string }>>;
}) {
  const inputId = `cfg-${field.key}`;
  const err = errors[field.key];
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{field.label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type="number"
          step={field.step ?? 1}
          {...register(field.key as Path<TicketSystemConfigFormType>, {
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
      ) : field.helperText ? (
        <p className="text-xs text-muted-foreground">{field.helperText}</p>
      ) : null}
    </div>
  );
}

export default function AdminTicketSystemConfigsPage() {
  const configsQuery = useTicketSystemConfigs();
  const upsertMutation = useUpsertSystemConfig();

  const items = configsQuery.data?.data?.data;

  const defaultValues = useMemo(
    () => buildDefaultsFromConfigs(items),
    [items],
  );

  const form = useForm<TicketSystemConfigFormType>({
    resolver: zodResolver(TicketSystemConfigFormSchema),
    defaultValues: defaultValues as TicketSystemConfigFormType,
  });
  useClearServerFieldErrors(form);

  // Khi data từ BE về sau lần load đầu → reset form với value mới.
  useEffect(() => {
    if (items) {
      form.reset(defaultValues as TicketSystemConfigFormType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = form;

  const isPending = upsertMutation.isPending || isSubmitting;

  const onSubmit = async (data: TicketSystemConfigFormType) => {
    // Chỉ gửi các key user đã đổi (giảm risk + race với config khác).
    // Nếu form chưa load (dirtyFields rỗng) → không submit.
    const keysToUpdate = (
      Object.keys(TICKET_SYSTEM_CONFIG_KEY_MAP) as TicketSystemConfigFormKey[]
    ).filter((k) => dirtyFields[k]);

    if (keysToUpdate.length === 0) {
      toast.info("Không có thay đổi nào để lưu.");
      return;
    }

    // Lấy `valueType` & `description` cũ từ BE response để gửi lại đúng.
    let successCount = 0;
    const failures: { key: string; message: string }[] = [];

    for (const formKey of keysToUpdate) {
      const beKey = TICKET_SYSTEM_CONFIG_KEY_MAP[formKey];
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
    } else if (successCount === 0) {
      toast.error(
        `Cập nhật thất bại. ${failures[0].key}: ${failures[0].message}`,
      );
    } else {
      toast.warning(
        `Đã cập nhật ${successCount}/${keysToUpdate.length} cấu hình. Có ${failures.length} key lỗi.`,
      );
      // Log chi tiết để Admin biết key nào fail.
      failures.forEach((f) => console.warn(`[system-config] ${f.key}: ${f.message}`));
    }
  };

  const handleResetToServer = () => {
    reset(defaultValues as TicketSystemConfigFormType);
    toast.info("Đã khôi phục về giá trị đang lưu trên hệ thống.");
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cấu Hình Quy Trình Ticket
          </CardTitle>
          <CardDescription>
            Tham số vận hành của vòng đời ticket — thời gian tự đóng, ngưỡng
            im lặng của bác sĩ, thứ tự ưu tiên gửi ticket, thời gian chờ AI
            tiếp nhận, trần hoa hồng và thang điểm đánh giá.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 9 }).map((_, i) => (
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
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Group 1: Lifecycle */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold mb-2">
                  Vòng đời ticket
                </legend>
                <div className="grid gap-4 md:grid-cols-2">
                  {GROUP_LIFECYCLE.map((field) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                    />
                  ))}
                </div>
              </fieldset>

              <Separator />

              {/* Group 2: Priority window */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold mb-2">
                  Thứ tự ưu tiên gửi ticket
                </legend>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Quy trình gửi ticket: ngay lập tức gửi cho Bạch kim trực
                    tuyến · sau X giây mở thêm Vàng · sau Y giây mở cho tất
                    cả bác sĩ trực tuyến (Bạc và Đồng) · cuối cùng AI tiếp
                    nhận nếu vẫn chưa ai nhận.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4 md:grid-cols-3">
                  {GROUP_PRIORITY_WINDOW.map((field) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                    />
                  ))}
                </div>
              </fieldset>

              <Separator />

              {/* Group 3: Commission & rating */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold mb-2">
                  Hoa hồng &amp; đánh giá
                </legend>
                <div className="grid gap-4 md:grid-cols-2">
                  {GROUP_COMMISSION.map((field) => (
                    <NumberField
                      key={field.key}
                      field={field}
                      register={register}
                      errors={errors}
                    />
                  ))}
                </div>
              </fieldset>

              <Separator />

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-2">
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
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
