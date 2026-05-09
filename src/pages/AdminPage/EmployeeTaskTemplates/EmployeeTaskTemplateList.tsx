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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { useState, useMemo } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
  useAdminListEmployeeTaskTemplates,
  useAdminDeleteEmployeeTaskTemplate,
} from "@/queries/useEmployeeTaskTemplate";
import type {
  ListEmployeeTaskTemplatesQueryType,
  EmployeeTaskTemplateResType,
} from "@/schemaValidatation/employeeTaskTemplate";

const PRIORITY_META: Record<
  string,
  { label: string; className: string; icon: typeof Flag }
> = {
  low: {
    label: "Thấp",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: Flag,
  },
  normal: {
    label: "Bình thường",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Flag,
  },
  high: {
    label: "Cao",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    icon: AlertTriangle,
  },
  urgent: {
    label: "Khẩn cấp",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    icon: AlertTriangle,
  },
};

interface EmployeeTaskTemplateListProps {
  onEdit: (template: EmployeeTaskTemplateResType) => void;
  onDetail: (template: EmployeeTaskTemplateResType) => void;
  onCreate: () => void;
}

export default function EmployeeTaskTemplateList({
  onEdit,
  onDetail,
  onCreate,
}: EmployeeTaskTemplateListProps) {
  const [query, setQuery] = useState<ListEmployeeTaskTemplatesQueryType>({
    page: 1,
    limit: 8,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const { data, isLoading } = useAdminListEmployeeTaskTemplates(effectiveQuery);
  const deleteMutation = useAdminDeleteEmployeeTaskTemplate();

  const templates = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const activeCount = templates.filter(
    (t) => t.isActive && !t.deletedAt,
  ).length;
  const inactiveCount = templates.filter(
    (t) => !t.isActive && !t.deletedAt,
  ).length;
  const deletedCount = templates.filter((t) => !!t.deletedAt).length;

  return (
    <>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Template nhiệm vụ nhân viên</CardTitle>
              <CardDescription className="mt-1">
                Quản lý template công việc giao cho nhân viên nông trại
              </CardDescription>
            </div>
            <Button onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo mới
            </Button>
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên template hoặc mô tả..."
                className="pl-9"
              />
            </div>

            <Select
              value={String(query.limit ?? 8)}
              onValueChange={(value) => {
                setQuery((prev) => ({
                  ...prev,
                  page: 1,
                  limit: Number(value),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Số mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 / trang</SelectItem>
                <SelectItem value="8">8 / trang</SelectItem>
                <SelectItem value="12">12 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <Power className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đang hoạt động
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">{activeCount}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đang tắt
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">{inactiveCount}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Đã xóa
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold">{deletedCount}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không tìm thấy template phù hợp với bộ lọc hiện tại.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => onDetail(template)}
                  className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                    template.deletedAt
                      ? "border-destructive/30 bg-muted/40 opacity-60"
                      : "border-border/70 bg-background hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium leading-tight">
                        {template.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">
                          <ClipboardList className="mr-1 h-3 w-3" />
                          Nhiệm vụ
                        </Badge>
                        <Badge
                          variant={
                            template.deletedAt
                              ? "destructive"
                              : template.isActive
                                ? "default"
                                : "secondary"
                          }
                          className={`gap-1 ${
                            !template.deletedAt && template.isActive
                              ? "bg-emerald-600 hover:bg-emerald-600/90"
                              : ""
                          }`}
                        >
                          {template.deletedAt ? (
                            <Trash2 className="h-3 w-3" />
                          ) : template.isActive ? (
                            <Power className="h-3 w-3" />
                          ) : (
                            <PowerOff className="h-3 w-3" />
                          )}
                          {template.deletedAt
                            ? "Đã xóa"
                            : template.isActive
                              ? "Hoạt động"
                              : "Tắt"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.items.length} nhiệm vụ | Cập nhật{" "}
                        {new Date(template.updatedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(template)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {!template.deletedAt && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(template.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {template.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {template.items.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.items.slice(0, 4).map((item) => {
                        const pMeta =
                          PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
                        return (
                          <span
                            key={item.id}
                            className={`inline-flex max-w-[200px] items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-medium ${pMeta.className}`}
                          >
                            {item.title}
                          </span>
                        );
                      })}
                      {template.items.length > 4 && (
                        <Badge variant="secondary">
                          +{template.items.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="Xóa template nhiệm vụ?"
        description="Hành động này sẽ xóa mềm template. Template sẽ không hiển thị cho Quản lý/Chủ trang trại."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate(deleteId);
          }
          setDeleteId(null);
        }}
      />
    </>
  );
}
