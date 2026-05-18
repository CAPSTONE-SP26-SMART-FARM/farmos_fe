import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable } from "@/components/common/DataTable";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCommissionRuleList,
  useSoftDeleteCommissionRule,
} from "@/queries/useCommissionRule";
import {
  CommissionScopeSchema,
  type CommissionRuleType,
  type CommissionScopeType,
  type ListCommissionRulesQueryType,
} from "@/schemaValidatation/commissionRule";
import { SCOPE_LABELS } from "./commissionRule.constants";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Ban,
  Eye,
  Info,
  Pencil,
  Percent,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatDateRange(from?: string | null, to?: string | null) {
  if (!from && !to) return "—";
  const f = from
    ? new Date(from).toLocaleDateString("vi-VN")
    : "không xác định";
  const t = to ? new Date(to).toLocaleDateString("vi-VN") : "không xác định";
  return `${f} → ${t}`;
}

function hasOverlappingRules(rules: CommissionRuleType[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      if (a.scope !== b.scope) continue;
      if (a.scope === "CATEGORY_DEFAULT" && a.categoryId !== b.categoryId)
        continue;
      if (a.scope === "DOCTOR_TIER" && a.doctorTier !== b.doctorTier) continue;
      if (a.scope === "DOCTOR" && a.doctorId !== b.doctorId) continue;
      const aFrom = a.effectiveFrom
        ? new Date(a.effectiveFrom).getTime()
        : null;
      const aTo = a.effectiveTo ? new Date(a.effectiveTo).getTime() : null;
      const bFrom = b.effectiveFrom
        ? new Date(b.effectiveFrom).getTime()
        : null;
      const bTo = b.effectiveTo ? new Date(b.effectiveTo).getTime() : null;
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

interface AdminCommissionRuleListSectionProps {
  onViewDetail?: (rule: CommissionRuleType) => void;
  onEdit?: (rule: CommissionRuleType) => void;
}

export default function AdminCommissionRuleListSection({
  onViewDetail,
  onEdit,
}: AdminCommissionRuleListSectionProps) {
  const [query, setQuery] = useState<ListCommissionRulesQueryType>({
    page: 1,
    limit: 20,
  });
  const [scopeFilter, setScopeFilter] = useState<CommissionScopeType | "ALL">(
    "ALL",
  );
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

  const columns = useMemo<ColumnDef<CommissionRuleType>[]>(
    () => [
      {
        accessorKey: "scope",
        header: "Phạm vi",
        cell: ({ row }) => {
          const isOverlap = overlapping.has(row.original.id);
          return (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">
                {SCOPE_LABELS[row.original.scope]}
              </Badge>
              {isOverlap && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="img"
                      aria-label="Trùng khoảng hiệu lực"
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Trùng hiệu lực
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      Quy tắc này có khoảng thời gian hiệu lực trùng với một
                      hoặc nhiều quy tắc khác cùng phạm vi. Hệ thống có thể áp
                      dụng sai % hoa hồng — vui lòng điều chỉnh để các khoảng
                      không chồng lấn.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        id: "subject",
        header: "Đối tượng",
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <span className="text-sm">
              {rule.scope === "CATEGORY_DEFAULT" &&
                (rule.category?.name ?? rule.categoryId ?? "—")}
              {rule.scope === "DOCTOR_TIER" && (rule.doctorTier ?? "—")}
              {rule.scope === "DOCTOR" &&
                (rule.doctor?.name ?? rule.doctorId ?? "—")}
            </span>
          );
        },
      },
      {
        accessorKey: "commissionPercent",
        header: () => <div className="text-right">Hoa hồng</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">
            {row.original.commissionPercent}%
          </div>
        ),
      },
      {
        id: "effective",
        header: "Thời gian hiệu lực",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateRange(
              row.original.effectiveFrom,
              row.original.effectiveTo,
            )}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Ghi chú",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground max-w-50 truncate block">
            {row.original.note ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              Đang hiệu lực
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Đã ngưng
            </Badge>
          ),
      },
    ],
    [overlapping],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Ngưng hiệu lực quy tắc hoa hồng thành công.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Quy Tắc Hoa Hồng
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Mapping % hoa hồng theo phạm vi áp dụng — danh mục, hạng bác sĩ
                hoặc bác sĩ cụ thể.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Phạm vi</p>
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
                  <TabsTrigger key={s} value={s}>
                    {SCOPE_LABELS[s]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {overlapping.size > 0 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠ Có {overlapping.size} quy tắc đang có khoảng thời gian hiệu lực
              trùng nhau. Kiểm tra lại để tránh áp dụng sai hoa hồng.
            </div>
          )}

          <div className="min-h-150">
            <DataTable
              columns={columns}
              data={rules}
              isLoading={listQuery.isLoading}
              rowClassName={(rule) =>
                overlapping.has(rule.id) ? "bg-yellow-50" : undefined
              }
              actions={[
                {
                  key: "detail",
                  label: "Chi tiết",
                  icon: Eye,
                  onSelect: (rule) => onViewDetail?.(rule),
                },
                {
                  key: "edit",
                  label: "Chỉnh sửa",
                  icon: Pencil,
                  onSelect: (rule) => onEdit?.(rule),
                },
                {
                  key: "delete",
                  label: "Ngưng hiệu lực",
                  icon: Ban,
                  variant: "destructive",
                  onSelect: (rule) => setDeleteTarget(rule),
                  hidden: (rule) => !rule.isActive,
                },
              ]}
              onRowClick={(rule) => onViewDetail?.(rule)}
              emptyText="Chưa có quy tắc hoa hồng nào."
            />
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              {meta
                ? `Trang ${meta.page} / ${meta.totalPages} (${meta.totalItems} mục)`
                : "—"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta?.hasPreviousPage}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: Math.max((prev.page ?? 1) - 1, 1),
                  }))
                }
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta?.hasNextPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
                }
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Ngưng hiệu lực quy tắc hoa hồng?"
        description={`Quy tắc "${deleteTarget ? SCOPE_LABELS[deleteTarget.scope] : ""}" sẽ bị ngưng. Thao tác này không thể hoàn tác.`}
        confirmLabel="Ngưng hiệu lực"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
