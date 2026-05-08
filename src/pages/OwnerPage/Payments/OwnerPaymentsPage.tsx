import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
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
import { useOwnerInvoices } from "@/queries/useInvoice";
import type { ListInvoicesQueryType } from "@/schemaValidatation/invoice";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const REFERENCE_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: "Gói đăng ký",
  SUBSCRIPTION_RENEWAL: "Gia hạn gói",
  SERVICE_PACKAGE: "Gói dịch vụ",
  IOT_KIT_ORDER: "Đơn Bộ Kit IoT",
};

type OwnerInvoiceRow = {
  id: string;
  invoiceNumber: string;
  referenceType: string;
  totalAmount: number;
  status: string;
};

function OwnerPaymentsPage() {
  const navigate = useNavigate();

  const [invoiceQuery, setInvoiceQuery] = useState<ListInvoicesQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    referenceType: undefined,
    referenceId: undefined,
  });

  const ownerInvoicesQuery = useOwnerInvoices(invoiceQuery, true);

  const invoices = ownerInvoicesQuery.data?.data?.data ?? [];
  const invoicesMeta = ownerInvoicesQuery.data?.data?.meta;

  const columns = useMemo<ColumnDef<OwnerInvoiceRow>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Mã hóa đơn",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.invoiceNumber}</span>
        ),
      },
      {
        accessorKey: "referenceType",
        header: "Loại",
        cell: ({ row }) => (
          <Badge variant="outline">
            {REFERENCE_TYPE_LABEL[row.original.referenceType] ??
              row.original.referenceType}
          </Badge>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Tổng tiền",
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <InvoiceStatusBadge status={row.original.status as InvoiceStatus} />
        ),
      },
    ],
    [],
  );

  const actions: DataTableAction<OwnerInvoiceRow>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Eye,
        onSelect: (invoice) =>
          navigate(`/dashboard/owner/payments/${invoice.id}`),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán và hóa đơn</CardTitle>
          <CardDescription>
            Theo dõi hóa đơn, mua thêm gói dịch vụ và kiểm soát biến động
            credit.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Tìm theo mã hóa đơn..."
            value={invoiceQuery.search ?? ""}
            onChange={(event) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                search: event.target.value || undefined,
              }))
            }
          />
          <Select
            value={invoiceQuery.status ?? "ALL"}
            onValueChange={(value) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                status:
                  value === "ALL"
                    ? undefined
                    : (value as Exclude<
                        ListInvoicesQueryType["status"],
                        undefined
                      >),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="OPEN">Chờ thanh toán</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="VOID">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={invoiceQuery.referenceType ?? "ALL"}
            onValueChange={(value) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                referenceType: value === "ALL" ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc loại hóa đơn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="SUBSCRIPTION">Gói đăng ký</SelectItem>
              <SelectItem value="SERVICE_PACKAGE">Gói dịch vụ</SelectItem>
              <SelectItem value="IOT_KIT_ORDER">Đơn Bộ Kit IoT</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={invoices}
            isLoading={ownerInvoicesQuery.isLoading}
            actions={actions}
            onRowClick={(invoice) =>
              navigate(`/dashboard/owner/payments/${invoice.id}`)
            }
            emptyText="Không có hóa đơn phù hợp."
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {invoicesMeta?.page ?? 1}/{invoicesMeta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!invoicesMeta?.hasPreviousPage}
                onClick={() =>
                  setInvoiceQuery((prev) => ({
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
                disabled={!invoicesMeta?.hasNextPage}
                onClick={() =>
                  setInvoiceQuery((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
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

export default OwnerPaymentsPage;
