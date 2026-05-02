import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArchiveRestore,
  Boxes,
  Pencil,
  PackageOpen,
  Search,
} from "lucide-react";
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

interface AdminIotKitListSectionProps {
  onEdit: (kit: IotDeviceKitResType) => void;
}

type StatusFilter = "all" | "active" | "archived";

export default function AdminIotKitListSection({
  onEdit,
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
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-primary" />
          Danh mục bộ Kit IoT
        </CardTitle>
        <CardDescription>
          Bộ Kit bán lẻ giúp Owner mở rộng hạn mức thiết bị, đồng pha hạn với
          gói đăng ký.
        </CardDescription>

        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_200px_140px]">
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
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="archived">Đã lưu trữ</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="20">20 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Loại board</TableHead>
                <TableHead className="text-right">Số bộ</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, rowIdx) => (
                  <TableRow key={`skeleton-${rowIdx}`}>
                    {Array.from({ length: 8 }).map((__, colIdx) => (
                      <TableCell key={colIdx}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : kits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12">
                    <EmptyState
                      icon={PackageOpen}
                      title="Chưa có bộ Kit nào"
                      description="Tạo bộ Kit đầu tiên để Owner có thể mua thêm hạn mức thiết bị."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                kits.map((kit) => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-mono text-xs">
                      {kit.code}
                    </TableCell>
                    <TableCell className="font-medium">{kit.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {BOARD_TYPE_LABEL_VI[kit.boardType] ?? kit.boardType}
                    </TableCell>
                    <TableCell className="text-right">
                      {kit.deviceCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyVnd(kit.price)}
                    </TableCell>
                    <TableCell>
                      {kit.isActive ? (
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
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateVi(kit.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(kit)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Sửa
                        </Button>
                        {kit.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setArchiveTarget(kit)}
                          >
                            Lưu trữ
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnarchiveTarget(kit)}
                          >
                            <ArchiveRestore className="mr-1 h-4 w-4" />
                            Bỏ lưu trữ
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
