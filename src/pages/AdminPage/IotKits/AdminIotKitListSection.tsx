import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  Boxes,
  Eye,
  Info,
  PackageOpen,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
  useAdminArchiveIotKit,
  useAdminIotKits,
  useAdminUnarchiveIotKit,
} from "@/queries/useIotKit";
import {
  BOARD_TYPE_LABEL_VI,
  type IotDeviceKitResType,
  type ListIotKitsQueryType,
} from "@/schemaValidatation/iotKit";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import AdminIotKitArchiveConfirm from "./AdminIotKitArchiveConfirm";
import { onMutationError } from "@/lib/axios";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "archived";

interface AdminIotKitListSectionProps {
  onViewDetail?: (kit: IotDeviceKitResType) => void;
}

export default function AdminIotKitListSection({
  onViewDetail,
}: AdminIotKitListSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [archiveTarget, setArchiveTarget] =
    useState<IotDeviceKitResType | null>(null);
  const [unarchiveTarget, setUnarchiveTarget] =
    useState<IotDeviceKitResType | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const query: ListIotKitsQueryType = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isActive:
        status === "active" ? true : status === "archived" ? false : undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    [page, limit, debouncedSearch, status],
  );

  const listQuery = useAdminIotKits(query);
  const archiveMutation = useAdminArchiveIotKit();
  const unarchiveMutation = useAdminUnarchiveIotKit();

  const kits = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const kitColumns = useMemo<ColumnDef<IotDeviceKitResType>[]>(
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
        header: "Tên",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "boardType",
        header: "Loại board",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {BOARD_TYPE_LABEL_VI[row.original.boardType] ??
              row.original.boardType}
          </span>
        ),
      },
      {
        accessorKey: "deviceCount",
        header: () => <div className="text-right">Số bộ</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.original.deviceCount}</div>
        ),
      },
      {
        accessorKey: "price",
        header: () => <div className="text-right">Giá</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrencyVnd(row.original.price)}
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              Đang hoạt động
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground border-border"
            >
              Đã lưu trữ
            </Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateVi(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveMutation.mutateAsync(archiveTarget.id);
      toast.success(`Đã lưu trữ bộ Kit ${archiveTarget.code}.`);
      setArchiveTarget(null);
    } catch (error) {
      onMutationError(error, "Không thể lưu trữ bộ Kit.");
    }
  };

  const handleUnarchive = async () => {
    if (!unarchiveTarget) return;
    try {
      await unarchiveMutation.mutateAsync(unarchiveTarget.id);
      toast.success(`Đã bỏ lưu trữ bộ Kit ${unarchiveTarget.code}.`);
      setUnarchiveTarget(null);
    } catch (error) {
      onMutationError(error, "Không thể bỏ lưu trữ bộ Kit.");
    }
  };

  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Danh mục các gói Kit IoT
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              Bộ Kit bán lẻ giúp Chủ trang trại mở rộng hạn mức thiết bị bao gồm
              trong gói đăng ký.
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
                placeholder="Tìm theo tên hoặc mã bộ Kit"
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
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="archived">Đã lưu trữ</SelectItem>
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

        {!listQuery.isLoading && kits.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="Chưa có bộ Kit nào"
            description="Tạo bộ Kit đầu tiên để Chủ trang trại có thể mua thêm hạn mức thiết bị."
          />
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={kitColumns}
              data={kits}
              isLoading={listQuery.isLoading}
              actions={[
                {
                  key: "detail",
                  label: "Chi tiết",
                  icon: Eye,
                  onSelect: (kit) => onViewDetail?.(kit),
                },
                {
                  key: "archive",
                  label: "Lưu trữ",
                  icon: Archive,
                  hidden: (kit) => !kit.isActive,
                  onSelect: (kit) => setArchiveTarget(kit),
                },
                {
                  key: "unarchive",
                  label: "Bỏ lưu trữ",
                  icon: ArchiveRestore,
                  hidden: (kit) => kit.isActive,
                  onSelect: (kit) => setUnarchiveTarget(kit),
                },
              ]}
              onRowClick={(kit) => onViewDetail?.(kit)}
              emptyText="Chưa có bộ Kit nào."
            />
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
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AdminIotKitArchiveConfirm
        kit={archiveTarget}
        mode="archive"
        isPending={archiveMutation.isPending}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
      />
      <AdminIotKitArchiveConfirm
        kit={unarchiveTarget}
        mode="unarchive"
        isPending={unarchiveMutation.isPending}
        onCancel={() => setUnarchiveTarget(null)}
        onConfirm={handleUnarchive}
      />
    </Card>
  );
}
