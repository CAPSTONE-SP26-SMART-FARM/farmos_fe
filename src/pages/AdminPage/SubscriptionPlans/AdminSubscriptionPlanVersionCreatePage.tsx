import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
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
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { useListFeatures } from "@/queries/useFeature";
import {
  useAdminCreateSubscriptionPlanVersion,
  useSubscriptionPlanDetail,
} from "@/queries/useSubscriptionPlan";
import {
  CreatePlanVersionBodySchema,
  type CreatePlanVersionBodyType,
} from "@/schemaValidatation/subscriptionPlan";
import { MoveLeft, Plus, Sparkles, Trash2 } from "lucide-react";

const DEFAULT_VERSION_FORM: CreatePlanVersionBodyType = {
  changelog: "",
  features: [{ featureCode: "", value: "", note: "" }],
};

const UNIT_LABELS_VI: Record<string, string> = {
  farms: "nông trại",
  zones: "khu vực",
  members: "nhân viên",
  devices: "thiết bị",
  "tickets/month": "lượt tư vấn/tháng",
  days: "ngày",
};

const getFeatureUnitLabelVi = (feature?: {
  unit: string | null;
  valueType: string;
}) => {
  if (feature?.unit) {
    return UNIT_LABELS_VI[feature.unit] ?? feature.unit;
  }

  if (feature?.valueType === "BOOLEAN") {
    return "Bật/Tắt";
  }

  return "Không đơn vị";
};

function AdminSubscriptionPlanVersionCreatePage() {
  const navigate = useNavigate();
  const { planId = "" } = useParams();

  const createVersionMutation = useAdminCreateSubscriptionPlanVersion();
  const planDetailQuery = useSubscriptionPlanDetail(planId, Boolean(planId));
  const featureListQuery = useListFeatures({
    page: 1,
    limit: 60,
    search: undefined,
  });

  const features = featureListQuery.data?.data.data ?? [];

  const form = useForm<CreatePlanVersionBodyType>({
    resolver: zodResolver(CreatePlanVersionBodySchema),
    defaultValues: DEFAULT_VERSION_FORM,
  });

  useClearServerFieldErrors(form);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const featureMap = useMemo(
    () => new Map(features.map((feature) => [feature.code, feature])),
    [features],
  );

  const handleSubmit = async (values: CreatePlanVersionBodyType) => {
    if (!planId) {
      toast.error("Không tìm thấy gói để tạo phiên bản.");
      return;
    }

    try {
      await createVersionMutation.mutateAsync({
        planId,
        data: {
          changelog: values.changelog?.trim() || undefined,
          features: values.features.map((feature) => ({
            featureCode: feature.featureCode.trim(),
            value: feature.value.trim(),
            note: feature.note?.trim() || undefined,
          })),
        },
      });

      toast.success("Tạo phiên bản gói thành công.");
      navigate(`/dashboard/admin/subscription-plans/${planId}`);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreatePlanVersionBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreatePlanVersionBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      toast.error(getApiErrorMessageVi(error, "Tạo phiên bản thất bại."));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/dashboard/admin/subscription-plans/${planId}`)
          }
        >
          <MoveLeft className="mr-2 h-4 w-4" />
          Quay lại chi tiết gói
        </Button>

        <Badge
          variant="outline"
          className="gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Tạo phiên bản mới
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo phiên bản mới</CardTitle>
          <CardDescription>
            Chọn feature từ danh mục API và điền giá trị áp dụng cho phiên bản.
          </CardDescription>
          {planDetailQuery.data?.data && (
            <p className="text-sm text-muted-foreground">
              Gói hiện tại:{" "}
              <span className="font-medium text-foreground">
                {planDetailQuery.data.data.name}
              </span>{" "}
              ({planDetailQuery.data.data.code})
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <Controller
              name="changelog"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="version-changelog">
                    Ghi chú thay đổi
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="version-changelog"
                      value={field.value ?? ""}
                      placeholder="Mô tả thay đổi chính của phiên bản này..."
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Danh sách tính năng</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ featureCode: "", value: "", note: "" })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Thêm dòng
                </Button>
              </div>

              {fields.map((item, index) => {
                const selectedFeatureCode = form.watch(
                  `features.${index}.featureCode`,
                );
                const selectedFeature = featureMap.get(selectedFeatureCode);
                const unitLabel = getFeatureUnitLabelVi(selectedFeature);
                const isBooleanValueInput =
                  !selectedFeature?.unit &&
                  selectedFeature?.valueType === "BOOLEAN";
                const isNumericValueInput = Boolean(selectedFeature?.unit);

                return (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-lg border p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Controller
                        name={`features.${index}.featureCode`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Mã tính năng</FieldLabel>
                            <FieldContent>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const feature = featureMap.get(value);
                                  form.setValue(
                                    `features.${index}.value`,
                                    feature?.valueType === "BOOLEAN"
                                      ? "true"
                                      : (feature?.defaultValue ?? ""),
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );
                                }}
                                disabled={featureListQuery.isLoading}
                              >
                                <SelectTrigger
                                  aria-invalid={fieldState.invalid}
                                >
                                  <SelectValue
                                    placeholder={
                                      featureListQuery.isLoading
                                        ? "Đang tải danh mục feature..."
                                        : "Chọn feature"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {features.map((feature) => (
                                    <SelectItem
                                      key={feature.code}
                                      value={feature.code}
                                    >
                                      {feature.code} - {feature.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError errors={[fieldState.error]} />
                            </FieldContent>
                          </Field>
                        )}
                      />

                      <Controller
                        name={`features.${index}.value`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Giá trị</FieldLabel>
                            <FieldContent>
                              {isBooleanValueInput ? (
                                <Select
                                  value={field.value || "true"}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger
                                    aria-invalid={fieldState.invalid}
                                  >
                                    <SelectValue placeholder="Chọn trạng thái" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">Bật</SelectItem>
                                    <SelectItem value="false">Tắt</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : isNumericValueInput ? (
                                <Input
                                  type="number"
                                  min={0}
                                  step={
                                    selectedFeature?.valueType === "DECIMAL"
                                      ? "0.01"
                                      : "1"
                                  }
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder={`Nhập giá trị theo ${unitLabel}`}
                                  aria-invalid={fieldState.invalid}
                                />
                              ) : (
                                <Input
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Nhập giá trị"
                                  aria-invalid={fieldState.invalid}
                                />
                              )}
                              <FieldError errors={[fieldState.error]} />
                            </FieldContent>
                          </Field>
                        )}
                      />
                    </div>

                    {selectedFeature && (
                      <p className="text-xs text-muted-foreground">
                        Đơn vị: {unitLabel}
                      </p>
                    )}

                    <Controller
                      name={`features.${index}.note`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Ghi chú</FieldLabel>
                          <FieldContent>
                            <Input
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Ghi chú thêm cho tính năng (không bắt buộc)"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </FieldContent>
                        </Field>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Xóa dòng
                      </Button>
                    </div>
                  </div>
                );
              })}

              {typeof form.formState.errors.features?.message === "string" && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.features.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/dashboard/admin/subscription-plans/${planId}`)
                }
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createVersionMutation.isPending}
              >
                {createVersionMutation.isPending
                  ? "Đang tạo..."
                  : "Tạo phiên bản"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSubscriptionPlanVersionCreatePage;
