import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  useAdminTicketCategoryList,
  useToggleTicketCategory,
} from "@/queries/useTicketCategory";
import type {
  ListTicketCategoriesQueryType,
  TicketCategoryType,
} from "@/schemaValidatation/ticketCategory";
import type { ColumnDef } from "@tanstack/react-table";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  Eye,
  Info,
  Loader2,
  PackageOpen,
  Pencil,
  Power,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

interface AdminTicketCategoryListSectionProps {
  onViewDetail?: (category: TicketCategoryType) => void;
  onEdit?: (category: TicketCategoryType) => void;
}

export default function AdminTicketCategoryListSection({
  onViewDetail,
  onEdit,
}: AdminTicketCategoryListSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [confirmTarget, setConfirmTarget] = useState<TicketCategoryType | null>(
    null,
  );
  const [blockingError, setBlockingError] = useState<{
    categoryName: string;
    message: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const query: ListTicketCategoriesQueryType = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isActive:
        status === "active" ? true : status === "inactive" ? false : undefined,
    }),
    [page, limit, debouncedSearch, status],
  );

  const listQuery = useAdminTicketCategoryList(query);
  const toggleMutation = useToggleTicketCategory();

  const categories = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const columns = useMemo<ColumnDef<TicketCategoryType>[]>(
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
        header: "Tên danh mục",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: () => <div className="text-right">Đơn giá</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {formatVnd(row.original.unitPrice)}
          </div>
        ),
      },
      {
        accessorKey: "defaultCommissionPercent",
        header: () => <div className="text-right">Hoa hồng</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.defaultCommissionPercent}%
          </div>
        ),
      },
      {
        accessorKey: "creditType",
        header: "Credit type (auto)",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.creditType ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "eligibleForSubscriptionGrant",
        header: "Gói đăng ký",
        cell: ({ row }) =>
          row.original.eligibleForSubscriptionGrant ? (
            <Badge variant="secondary">Có</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Không</span>
          ),
      },
      {
        accessorKey: "eligibleForPurchase",
        header: "Mua lẻ",
        cell: ({ row }) =>
          row.original.eligibleForPurchase ? (
            <Badge variant="secondary">Có</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Không</span>
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

  const performToggle = async (category: TicketCategoryType) => {
    try {
      await toggleMutation.mutateAsync({
        id: category.id,
        body: { isActive: !category.isActive },
      });
      toast.success(
        `${category.isActive ? "Vô hiệu hoá" : "Kích hoạt"} danh mục "${category.name}" thành công.`,
      );
      setBlockingError(null);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const data = err.response.data;
        const hint =
          data?.errors?.[0]?.message ??
          data?.message ??
          "Không thể thay đổi trạng thái danh mục này.";
        setBlockingError({ categoryName: category.name, message: hint });
        toast.error(hint);
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  const handleToggleAction = (category: TicketCategoryType) => {
    if (!category.isActive) {
      void performToggle(category);
      return;
    }
    setConfirmTarget(category);
  };

  return (
    <>
      {blockingError && (
        <Alert variant="destructive" className="relative pr-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Không thể vô hiệu hoá "{blockingError.categoryName}"
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p>{blockingError.message}</p>
            <p className="text-xs text-muted-foreground">
              Cần xử lý các tài nguyên đang phụ thuộc (owner còn balance,
              subscription đang cấp, ticket chưa đóng) trước khi tắt danh mục
              này.
            </p>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setBlockingError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Danh Mục Ticket
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Quản lý danh mục dịch vụ ticket — đơn giá, hoa hồng và quyền
                truy cập (gói / mua lẻ).
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
                  placeholder="Tìm theo tên hoặc mã danh mục"
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
                title="Chưa có danh mục nào"
                description="Tạo danh mục đầu tiên để bắt đầu cung cấp dịch vụ ticket."
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
                      hidden: (cat) => !cat.isActive,
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
                  emptyText="Không có danh mục nào."
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
              Vô hiệu hoá danh mục "{confirmTarget?.name ?? ""}"?
            </DialogTitle>
            <DialogDescription>
              Hành động có thể bị backend chặn nếu danh mục còn ràng buộc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>BE sẽ kiểm tra 3 nguồn block:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Owner đang giữ balance theo credit type của danh mục</li>
              <li>Subscription đang cấp entitlement theo feature code</li>
              <li>
                Ticket chưa terminal (open / assigned / in_progress / resolved)
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Nếu bị chặn, chi tiết tài nguyên cần xử lý sẽ hiện ở banner phía
              trên trang.
            </p>
          </div>
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
