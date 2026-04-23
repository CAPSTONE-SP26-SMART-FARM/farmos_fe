import { useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoiceDetail } from "@/queries/useInvoice";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function AdminInvoiceDetailPage() {
  const { invoiceId = "" } = useParams<{ invoiceId: string }>();
  const invoiceDetailQuery = useInvoiceDetail(invoiceId, Boolean(invoiceId));
  const invoice = invoiceDetailQuery.data?.data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết hóa đơn</CardTitle>
          <CardDescription>
            Theo dõi line items và lịch sử giao dịch thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoiceDetailQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Đang tải chi tiết hóa đơn...</p>
          )}
          {!invoiceDetailQuery.isLoading && !invoice && (
            <p className="text-sm text-muted-foreground">Không tìm thấy hóa đơn.</p>
          )}
          {invoice && (
            <div className="grid gap-2 rounded-md border p-4 text-sm">
              <p>
                Mã hóa đơn: <span className="font-medium">{invoice.invoiceNumber}</span>
              </p>
              <p>
                Trạng thái: <Badge>{invoice.status}</Badge>
              </p>
              <p>Tổng tiền: {formatCurrency(invoice.totalAmount)}</p>
              <p>Loại tham chiếu: {invoice.referenceType}</p>
              <p>Ngày đến hạn: {invoice.dueDate ?? "-"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết dòng tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity ?? "-"}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cổng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.gateway}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.status}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>{tx.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminInvoiceDetailPage;
