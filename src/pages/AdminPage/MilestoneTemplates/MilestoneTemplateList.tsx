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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/queryClient";
import {
  useAdminDeleteMilestoneTemplate,
  useAdminListMilestoneTemplates,
} from "@/queries/useAdmin";
import type {
  ListMilestoneTemplatesQueryType,
  MilestoneTemplateResType,
} from "@/schemaValidatation/milestoneTemplate";
import {
  AlertCircle,
  Clock3,
  Eye,
  Loader2,
  Milestone,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  Ban,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const FARM_TYPE_LABEL: Record<string, string> = {
  cultivation: "Canh tác",
};

interface MilestoneTemplateListProps {
  onCreate: () => void;
  onEdit: (template: MilestoneTemplateResType) => void;
  onDetail: (template: MilestoneTemplateResType) => void;
}

export default function MilestoneTemplateList({
  onCreate,
  onEdit,
  onDetail,
}: MilestoneTemplateListProps) {
  const [query, setQuery] = useState<ListMilestoneTemplatesQueryType>({
    page: 1,
    limit: 8,
  });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      type: "crop_season" as const,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const listQuery = useAdminListMilestoneTemplates(effectiveQuery);
  const deleteMutation = useAdminDeleteMilestoneTemplate();

  const templates = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  useEffect(() => {
    if (
      listQuery.isLoading ||
      !meta?.hasPreviousPage ||
      templates.length > 0 ||
      meta.page <= 1
    ) {
      return;
    }

    setQuery((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, [
    listQuery.isLoading,
    meta?.hasPreviousPage,
    meta?.page,
    templates.length,
  ]);

  return (
    <>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Danh sách mẫu cột mốc</CardTitle>
              <CardDescription className="mt-1">
                Quản lý mẫu mốc sản xuất dùng cho mùa vụ
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setQuery((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Tìm theo tên mẫu hoặc mô tả..."
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
          {listQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border p-4"
                >
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : listQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Không thể tải danh sách mẫu cột mốc
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getErrorMessage(listQuery.error)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void listQuery.refetch()}
                  >
                    Thử lại
                  </Button>
                </div>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Milestone className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                Chưa có mẫu phù hợp
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Bắt đầu bằng cách tạo mẫu cột mốc mới cho canh tác.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={onCreate}
              >
                <Plus className="mr-1 h-4 w-4" />
                Tạo mẫu đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => {
                const orderedItems = [...template.items].sort(
                  (left, right) => left.milestoneOrder - right.milestoneOrder,
                );

                return (
                  <div
                    key={template.id}
                    onClick={() => template.deletedAt ? onDetail(template) : onEdit(template)}
                    className={`group cursor-pointer rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md ${
                      template.deletedAt
                        ? "border-border/60 bg-muted/20 opacity-70"
                        : template.isActive
                          ? "border-border/70 bg-background"
                          : "border-border/60 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">
                          {template.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="capitalize"
                          >
                            {FARM_TYPE_LABEL[template.farmType] ??
                              template.farmType}
                          </Badge>
                          {template.deletedAt ? (
                            <Badge
                              variant="destructive"
                              className="gap-1"
                            >
                              <Ban className="h-3 w-3" />
                              Đã xóa
                            </Badge>
                          ) : (
                            <Badge
                              variant={
                                template.isActive ? "default" : "secondary"
                              }
                              className={`gap-1 ${
                                template.isActive
                                  ? "bg-emerald-600 hover:bg-emerald-600/90"
                                  : ""
                              }`}
                            >
                              {template.isActive ? (
                                <Power className="h-3 w-3" />
                              ) : (
                                <PowerOff className="h-3 w-3" />
                              )}
                              {template.isActive ? "Hoạt động" : "Đang tắt"}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {orderedItems.length} giai đoạn | Cập nhật{" "}
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
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              onDetail(template);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          {!template.deletedAt && (
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                onEdit(template);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                          )}
                          {!template.deletedAt && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteId(template.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {template.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {template.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {orderedItems.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          <Clock3 className="h-3 w-3" />#{item.milestoneOrder}{" "}
                          {item.stageName}
                        </span>
                      ))}
                      {orderedItems.length > 4 && (
                        <Badge variant="secondary">
                          +{orderedItems.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span>
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mẫu)
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
                    setQuery((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
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
        title="Xóa mẫu cột mốc?"
        description="Hành động này sẽ xóa mềm mẫu và mẫu sẽ không còn khả dụng cho phiên lập kế hoạch mới."
        confirmLabel={deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setDeleteId(null);
          }
        }}
        onConfirm={() => {
          if (!deleteId || deleteMutation.isPending) {
            return;
          }

          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast.success("Đã xóa mẫu cột mốc");
              setDeleteId(null);
            },
            onError: (error) => {
              toast.error(getErrorMessage(error));
              setDeleteId(null);
            },
          });
        }}
      />

      {listQuery.isFetching && !listQuery.isLoading && (
        <div className="fixed bottom-4 right-4 z-30 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang đồng bộ dữ liệu...
          </span>
        </div>
      )}
    </>
  );
}
