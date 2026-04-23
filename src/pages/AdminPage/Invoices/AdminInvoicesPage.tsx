import { useState } from "react";
import { useNavigate } from "react-router";
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
import { useAdminInvoices } from "@/queries/useInvoice";
import type {
  InvoiceStatusType,
  ListInvoicesQueryType,
} from "@/schemaValidatation/invoice";

const STATUS_OPTIONS: Array<{ value: "ALL" | InvoiceStatusType; label: string }> =
  [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "DRAFT", label: "DRAFT" },
    { value: "OPEN", label: "OPEN" },
    { value: "PAID", label: "PAID" },
    { value: "VOID", label: "VOID" },
    { value: "UNCOLLECTIBLE", label: "UNCOLLECTIBLE" },
  ];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

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

  const listInvoicesQuery = useAdminInvoices(query);
  const invoices = listInvoicesQuery.data?.data?.data ?? [];
  const meta = listInvoicesQuery.data?.data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý hóa đơn</CardTitle>
          <CardDescription>
            Admin có thể xem toàn bộ hóa đơn subscription và gói dịch vụ.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
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
                status: value === "ALL" ? undefined : (value as InvoiceStatusType),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Loại tham chiếu</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listInvoicesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Đang tải danh sách hóa đơn...
                  </TableCell>
                </TableRow>
              )}
              {!listInvoicesQuery.isLoading && invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Không có dữ liệu hóa đơn.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.referenceType}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/dashboard/admin/invoices/${invoice.id}`)}
                    >
                      Mở
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {meta?.page ?? 1}/{meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasPreviousPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNextPage}
                onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
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
