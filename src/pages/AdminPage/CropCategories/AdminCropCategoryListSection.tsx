import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmptyState from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import useDebounce from "@/hooks/useDebounce";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminCropCategoryList,
  useToggleCropCategory,
} from "@/queries/useCropCategory";
import type {
  CropCategoryType,
  ListCropCategoriesQueryType,
} from "@/schemaValidatation/cropCategory";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Info,
  Loader2,
  PackageOpen,
  Pencil,
  Power,
  Search,
  Sprout,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";

const OTHER_CODE = "OTHER";

const formatDensity = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

interface AdminCropCategoryListSectionProps {
  onViewDetail?: (category: CropCategoryType) => void;
  onEdit?: (category: CropCategoryType) => void;
}

export default function AdminCropCategoryListSection({
  onViewDetail,
  onEdit,
}: AdminCropCategoryListSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [confirmTarget, setConfirmTarget] = useState<CropCategoryType | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 500);

  const query: ListCropCategoriesQueryType = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isActive:
        status === "active" ? true : status === "inactive" ? false : undefined,
    }),
    [page, limit, debouncedSearch, status],
  );

  const listQuery = useAdminCropCategoryList(query);
  const toggleMutation = useToggleCropCategory();

  const categories = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const columns = useMemo<ColumnDef<CropCategoryType>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Mã",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Tên loại cây",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="font-medium">{row.original.name}</p>
            {row.original.scientificName && (
              <p className="text-xs italic text-muted-foreground">
                {row.original.scientificName}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "density",
        header: () => <div className="text-right">Mật độ (cây/m²)</div>,
        cell: ({ row }) => {
          const { minPlantingDensity, maxPlantingDensity, recommendedDensity } =
            row.original;
          return (
            <div className="text-right tabular-nums text-xs">
              <p>
                {formatDensity(minPlantingDensity)} –{" "}
                {formatDensity(maxPlantingDensity)}
              </p>
              {recommendedDensity != null && (
                <p className="text-muted-foreground">
                  Khuyến nghị {formatDensity(recommendedDensity)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "defaultCycleDays",
        header: () => <div className="text-right">Chu kỳ (ngày)</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.defaultCycleDays ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "minAreaSqm",
        header: () => <div className="text-right">DT tối thiểu (m²)</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.minAreaSqm != null ? (
              formatDensity(row.original.minAreaSqm)
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "default" : "outline"}
            className={
              row.original.isActive
                ? "bg-green-100 text-green-800 border-green-200"
                : "text-muted-foreground"
            }
          >
            {row.original.isActive ? "Hoạt động" : "Vô hiệu"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const performToggle = async (category: CropCategoryType) => {
    try {
      await toggleMutation.mutateAsync({
        id: category.id,
        body: { isActive: !category.isActive },
      });
      toast.success(
        `${category.isActive ? "Vô hiệu hoá" : "Kích hoạt"} loại cây "${
          category.name
        }" thành công.`,
      );
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    }
  };

  const handleToggleAction = (category: CropCategoryType) => {
    if (category.code === OTHER_CODE && category.isActive) {
      toast.error(
        "Không thể tắt loại OTHER — đây là loại mặc định cho giống chưa catalog.",
      );
      return;
    }
    if (!category.isActive) {
      void performToggle(category);
      return;
    }
    setConfirmTarget(category);
  };

  return (
    <>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary" />
              Loại cây trồng
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Đây là danh sách loại cây mà quản lý sẽ chọn khi tạo mùa vụ. Khi
                bạn chỉnh sửa mật độ ở đây, các mùa vụ đã tạo trước đó vẫn giữ
                nguyên thông số ban đầu và không bị ảnh hưởng.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_140px]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo mã / tên / tên khoa học"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Trạng thái</p>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Số mục</p>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-150">
            {!listQuery.isLoading && categories.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="Chưa có loại cây nào"
                description="Tạo loại cây đầu tiên để Manager có thể chọn khi tạo mùa vụ."
              />
            ) : (
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={categories}
                  isLoading={listQuery.isLoading}
                  actions={[
                    {
                      key: "detail",
                      label: "Chi tiết",
                      icon: Eye,
                      onSelect: (cat) => onViewDetail?.(cat),
                    },
                    {
                      key: "edit",
                      label: "Chỉnh sửa",
                      icon: Pencil,
                      onSelect: (cat) => onEdit?.(cat),
                    },
                    {
                      key: "toggle",
                      label: "Vô hiệu hoá",
                      icon: Power,
                      hidden: (cat) => !cat.isActive || cat.code === OTHER_CODE,
                      disabled: () => toggleMutation.isPending,
                      variant: "destructive",
                      onSelect: (cat) => handleToggleAction(cat),
                    },
                    {
                      key: "activate",
                      label: "Kích hoạt",
                      icon: Power,
                      hidden: (cat) => cat.isActive,
                      disabled: () => toggleMutation.isPending,
                      onSelect: (cat) => handleToggleAction(cat),
                    },
                  ]}
                  onRowClick={(cat) => onViewDetail?.(cat)}
                  emptyText="Không có loại cây nào khớp bộ lọc."
                />
              </div>
            )}
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
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta?.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vô hiệu hoá loại cây "{confirmTarget?.name ?? ""}"?
            </DialogTitle>
            <DialogDescription>
              Sau khi vô hiệu hoá, quản lý sẽ{" "}
              <strong>không còn thấy loại cây này</strong> trong danh sách khi
              tạo mùa vụ mới. Các mùa vụ đã tạo trước đó vẫn giữ nguyên thông
              tin và không bị ảnh hưởng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={toggleMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={toggleMutation.isPending}
              onClick={async () => {
                if (!confirmTarget) return;
                const target = confirmTarget;
                setConfirmTarget(null);
                await performToggle(target);
              }}
            >
              {toggleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Vô hiệu hoá"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
