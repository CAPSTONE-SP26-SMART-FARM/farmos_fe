import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCommissionRuleList,
  useSoftDeleteCommissionRule,
  useUpdateCommissionRule,
} from "@/queries/useCommissionRule";
import {
  CommissionScopeSchema,
  UpdateCommissionRuleBodySchema,
  type CommissionRuleType,
  type CommissionScopeType,
  type ListCommissionRulesQueryType,
  type UpdateCommissionRuleBodyType,
} from "@/schemaValidatation/commissionRule";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { CalendarDays, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
const SCOPE_LABELS: Record<CommissionScopeType, string> = {
  CATEGORY_DEFAULT: "Mặc định danh mục",
  DOCTOR_TIER: "Cấp bậc bác sĩ",
  DOCTOR: "Bác sĩ cụ thể",
};

const DATE_DISPLAY_FORMAT = "dd/MM/yyyy";
const DATE_PAYLOAD_FORMAT = "yyyy-MM-dd";

function parseBackendDate(value: string | null | undefined) {
  if (!value) return undefined;
  const parsed = parse(value, DATE_PAYLOAD_FORMAT, new Date());
  if (isValid(parsed)) return parsed;

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatPickerDate(value: string | null | undefined) {
  const parsed = parseBackendDate(value);
  return parsed ? format(parsed, DATE_DISPLAY_FORMAT) : "";
}

function DatePickerField({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between text-left font-normal"
          >
            {value ? (
              formatPickerDate(value)
            ) : (
              <span className="text-muted-foreground">
                {placeholder ?? "Chọn ngày"}
              </span>
            )}
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parseBackendDate(value)}
            onSelect={(date) =>
              onChange(date ? format(date, DATE_PAYLOAD_FORMAT) : "")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <p className="text-destructive text-xs">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

function formatDateRange(from?: string | null, to?: string | null) {
  if (!from && !to) return "—";
  const f = from
    ? new Date(from).toLocaleDateString("vi-VN")
    : "không xác định";
  const t = to ? new Date(to).toLocaleDateString("vi-VN") : "không xác định";
  return `${f} → ${t}`;
}

// ── Overlap detection ─────────────────────────────────────────────────────────
function hasOverlappingRules(rules: CommissionRuleType[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      if (a.scope !== b.scope) continue;
      // Check same discriminator
      if (a.scope === "CATEGORY_DEFAULT" && a.categoryId !== b.categoryId)
        continue;
      if (a.scope === "DOCTOR_TIER" && a.doctorTier !== b.doctorTier) continue;
      if (a.scope === "DOCTOR" && a.doctorId !== b.doctorId) continue;
      // Check date overlap: both have effective ranges that overlap
      const aFrom = a.effectiveFrom
        ? new Date(a.effectiveFrom).getTime()
        : null;
      const aTo = a.effectiveTo ? new Date(a.effectiveTo).getTime() : null;
      const bFrom = b.effectiveFrom
        ? new Date(b.effectiveFrom).getTime()
        : null;
      const bTo = b.effectiveTo ? new Date(b.effectiveTo).getTime() : null;
      // Ranges overlap unless one ends before the other starts
      const aEnd = aTo ?? Infinity;
      const bEnd = bTo ?? Infinity;
      const aStart = aFrom ?? -Infinity;
      const bStart = bFrom ?? -Infinity;
      if (aStart < bEnd && bStart < aEnd) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  return overlapping;
}

// ── Edit form ─────────────────────────────────────────────────────────────────
function EditRuleForm({
  rule,
  onClose,
}: {
  rule: CommissionRuleType;
  onClose: () => void;
}) {
  const updateMutation = useUpdateCommissionRule();

  const form = useForm<UpdateCommissionRuleBodyType>({
    resolver: zodResolver(UpdateCommissionRuleBodySchema),
    defaultValues: {
      commissionPercent: rule.commissionPercent,
      effectiveFrom: rule.effectiveFrom?.split("T")[0] ?? "",
      effectiveTo: rule.effectiveTo?.split("T")[0] ?? "",
      note: rule.note ?? "",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: UpdateCommissionRuleBodyType) => {
    const payload = {
      ...data,
      effectiveFrom: data.effectiveFrom
        ? new Date(`${data.effectiveFrom}T00:00:00.000Z`).toISOString()
        : undefined,
      effectiveTo: data.effectiveTo
        ? new Date(`${data.effectiveTo}T00:00:00.000Z`).toISOString()
        : null,
      note: data.note?.trim() ? data.note : null,
    };
    try {
      await updateMutation.mutateAsync({ id: rule.id, body: payload });
      toast.success("Cập nhật quy tắc hoa hồng thành công.");
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity<UpdateCommissionRuleBodyType>(
          err.response.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Read-only scope info */}
      <div className="rounded-md border bg-muted/50 p-3 space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          Phạm vi (không thể sửa)
        </p>
        <Badge variant="secondary">{SCOPE_LABELS[rule.scope]}</Badge>
        {rule.category && (
          <p className="text-xs text-muted-foreground">
            Danh mục: {rule.category.name}
          </p>
        )}
        {rule.doctorTier && (
          <p className="text-xs text-muted-foreground">
            Cấp bậc: {rule.doctorTier}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label>
          Hoa hồng (%) <span className="text-destructive">*</span>
        </Label>
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          {...register("commissionPercent", { valueAsNumber: true })}
          aria-invalid={Boolean(errors.commissionPercent)}
        />
        {errors.commissionPercent && (
          <p className="text-destructive text-xs">
            {errors.commissionPercent.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="effectiveFrom"
          control={control}
          render={({ field, fieldState }) => (
            <DatePickerField
              label="Hiệu lực từ"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="effectiveTo"
          control={control}
          render={({ field, fieldState }) => (
            <DatePickerField
              label="Hiệu lực đến"
              value={field.value ?? ""}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="space-y-1">
        <Label>Ghi chú</Label>
        <Textarea
          {...register("note")}
          rows={2}
        />
      </div>

      <div className="border-t pt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Huỷ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-28"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminCommissionRulesPage() {
  const [query, setQuery] = useState<ListCommissionRulesQueryType>({
    page: 1,
    limit: 20,
  });
  const [scopeFilter, setScopeFilter] = useState<CommissionScopeType | "ALL">(
    "ALL",
  );
  const navigate = useNavigate();
  const [editTarget, setEditTarget] = useState<CommissionRuleType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommissionRuleType | null>(
    null,
  );

  const listQuery = useCommissionRuleList(
    scopeFilter === "ALL" ? query : { ...query, scope: scopeFilter },
  );
  const deleteMutation = useSoftDeleteCommissionRule();

  const rules = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;
  const overlapping = hasOverlappingRules(rules);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Xoá quy tắc hoa hồng thành công.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quy Tắc Hoa Hồng</CardTitle>
              <CardDescription>
                Mapping % hoa hong theo pham vi ap dung — danh muc, hang bac si
                hoac bac si cu the.
              </CardDescription>
            </div>
            <Button
              onClick={() =>
                navigate("/dashboard/admin/commission-rules/create")
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm quy tắc
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scope filter */}
          <Tabs
            value={scopeFilter}
            onValueChange={(v) => {
              setScopeFilter(v as CommissionScopeType | "ALL");
              setQuery((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              {CommissionScopeSchema.options.map((s) => (
                <TabsTrigger
                  key={s}
                  value={s}
                >
                  {SCOPE_LABELS[s]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {overlapping.size > 0 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠ Có {overlapping.size} quy tắc đang có khoảng thời gian hiệu lực
              trùng nhau. Kiểm tra lại để tránh áp dụng sai hoa hồng.
            </div>
          )}

          {/* Table */}
          {listQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phạm vi</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                  <TableHead>Thời gian hiệu lực</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Chưa có quy tắc hoa hồng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      className={overlapping.has(rule.id) ? "bg-yellow-50" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">
                            {SCOPE_LABELS[rule.scope]}
                          </Badge>
                          {overlapping.has(rule.id) && (
                            <Badge
                              variant="outline"
                              className="border-yellow-300 text-yellow-700 text-xs"
                            >
                              ⚠ Trùng
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.scope === "CATEGORY_DEFAULT" &&
                          (rule.category?.name ?? rule.categoryId ?? "—")}
                        {rule.scope === "DOCTOR_TIER" &&
                          (rule.doctorTier ?? "—")}
                        {rule.scope === "DOCTOR" &&
                          (rule.doctor?.name ?? rule.doctorId ?? "—")}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {rule.commissionPercent}%
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateRange(rule.effectiveFrom, rule.effectiveTo)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-50 truncate">
                        {rule.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditTarget(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.totalItems} quy tắc · Trang {meta.page}/{meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page! - 1 }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page! + 1 }))
                  }
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Quy Tắc</DialogTitle>
            <DialogDescription>
              Cập nhật hoa hồng và thời gian hiệu lực.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <EditRuleForm
              rule={editTarget}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá quy tắc hoa hồng?"
        description={`Quy tắc "${deleteTarget ? SCOPE_LABELS[deleteTarget.scope] : ""}" sẽ bị xoá. Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
