import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
import TransactionStatusBadge from "@/components/common/TransactionStatusBadge";
import { DataTable } from "@/components/common/DataTable";
import type { DataTableAction } from "@/components/common/DataTable/types";
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
import { useAdminInvoices } from "@/queries/useInvoice";
import type {
  InvoiceAdminListItemType,
  InvoiceLatestTransactionSummaryType,
  InvoiceReferenceType,
  InvoiceStatusType,
  ListInvoicesQueryType,
} from "@/schemaValidatation/invoice";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";

// Khớp đầy đủ enum BE `InvoiceStatus` (xem `prisma/schema.prisma:294-302`):
//   DRAFT · OPEN · PAID · VOID · UNCOLLECTIBLE
// Label tiếng Việt đồng bộ với `InvoiceStatusBadge` để filter và badge nhất
// quán cho user.
const STATUS_OPTIONS: Array<{
  value: "ALL" | InvoiceStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "OPEN", label: "Chưa thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "VOID", label: "Đã hủy" },
  { value: "UNCOLLECTIBLE", label: "Không thu được" },
];

const REFERENCE_TYPE_LABEL: Record<InvoiceReferenceType, string> = {
  SUBSCRIPTION: "Gói đăng ký",
  SERVICE_PACKAGE: "Gói dịch vụ",
  IOT_KIT_ORDER: "Đơn Bộ Kit IoT",
};

const REFERENCE_TYPE_OPTIONS: Array<{
  value: "ALL" | InvoiceReferenceType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả loại" },
  { value: "SUBSCRIPTION", label: REFERENCE_TYPE_LABEL.SUBSCRIPTION },
  { value: "SERVICE_PACKAGE", label: REFERENCE_TYPE_LABEL.SERVICE_PACKAGE },
  { value: "IOT_KIT_ORDER", label: REFERENCE_TYPE_LABEL.IOT_KIT_ORDER },
];

function LatestTransactionCell({
  tx,
}: {
  tx: InvoiceLatestTransactionSummaryType | null;
}) {
  if (!tx) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col gap-0.5">
      <TransactionStatusBadge
        status={tx.status}
        className="w-fit"
      />
      <span className="text-xs text-muted-foreground">
        {tx.gateway} · {formatDateVi(tx.createdAt)}
      </span>
    </div>
  );
}

function DueDateCell({
  invoice,
  nowMs,
}: {
  invoice: InvoiceAdminListItemType;
  nowMs: number;
}) {
  if (!invoice.dueDate) return <span className="text-muted-foreground">—</span>;

  const due = new Date(invoice.dueDate);
  const isOverdue =
    !Number.isNaN(due.getTime()) &&
    due.getTime() < nowMs &&
    invoice.status !== "PAID" &&
    invoice.status !== "VOID";

  return (
    <span className={isOverdue ? "text-destructive font-medium" : undefined}>
      {formatDateVi(invoice.dueDate)}
    </span>
  );
}

function AdminInvoicesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ListInvoicesQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    referenceType: undefined,
    referenceId: undefined,
  });
  const [nowMs] = useState(() => Date.now());

  const listInvoicesQuery = useAdminInvoices(query);
  const invoices = listInvoicesQuery.data?.data?.data ?? [];
  const meta = listInvoicesQuery.data?.data?.meta;

  const columns = useMemo<ColumnDef<InvoiceAdminListItemType>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Mã hóa đơn",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.invoiceNumber}</span>
        ),
      },
      {
        id: "customer",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {row.original.owner.fullName ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.owner.email ??
                row.original.owner.phone ??
                row.original.owner.id.slice(0, 8)}
            </span>
          </div>
        ),
      },
      {
        id: "reference",
        header: "Tham chiếu",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className="w-fit"
            >
              {row.original.reference
                ? REFERENCE_TYPE_LABEL[row.original.reference.type]
                : row.original.referenceType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {row.original.reference?.label ?? "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "issueDate",
        header: "Ngày phát hành",
        cell: ({ row }) => formatDateVi(row.original.issueDate),
      },
      {
        accessorKey: "dueDate",
        header: "Hạn thanh toán",
        cell: ({ row }) => (
          <DueDateCell
            invoice={row.original}
            nowMs={nowMs}
          />
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Tổng tiền</div>,
        cell: ({ row }) => (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-medium">
              {formatCurrencyVnd(row.original.totalAmount)}
            </span>
          </div>
        ),
      },
      {
        id: "latestTransaction",
        header: "Thanh toán gần nhất",
        cell: ({ row }) => (
          <LatestTransactionCell tx={row.original.latestTransaction} />
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <InvoiceStatusBadge status={row.original.status as InvoiceStatus} />
        ),
      },
    ],
    [nowMs],
  );

  const actions: DataTableAction<InvoiceAdminListItemType>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Eye,
        onSelect: (invoice) =>
          navigate(`/dashboard/admin/invoices/${invoice.id}`),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý hóa đơn</CardTitle>
          <CardDescription>
            Admin có thể xem toàn bộ hóa đơn subscription, gói dịch vụ và đơn
            mua bộ kit IoT — kèm thông tin khách hàng, tham chiếu và tình trạng
            thanh toán mới nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Tìm theo mã hóa đơn..."
            value={query.search ?? ""}
            onChange={(event) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                search: event.target.value || undefined,
              }))
            }
          />
          <Select
            value={query.status ?? "ALL"}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                status:
                  value === "ALL" ? undefined : (value as InvoiceStatusType),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={query.referenceType ?? "ALL"}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                referenceType: value === "ALL" ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lọc loại tham chiếu" />
            </SelectTrigger>
            <SelectContent>
              {REFERENCE_TYPE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={invoices}
              isLoading={listInvoicesQuery.isLoading}
              actions={actions}
              onRowClick={(invoice) =>
                navigate(`/dashboard/admin/invoices/${invoice.id}`)
              }
              emptyText={
                listInvoicesQuery.isError
                  ? "Không thể tải danh sách hóa đơn."
                  : "Không có dữ liệu hóa đơn."
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {meta?.page ?? 1}/{meta?.totalPages ?? 1} ·{" "}
              {meta?.totalItems ?? 0} hóa đơn
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasPreviousPage}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNextPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Trang sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminInvoicesPage;
