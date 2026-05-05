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
import type { DoctorPerformanceRow } from "../_mocks/ticketAnalytics.mock";

interface DoctorPerformanceTableProps {
  rows: DoctorPerformanceRow[];
  hideEscalated?: boolean;
  className?: string;
}

function DoctorPerformanceTable({
  rows,
  hideEscalated,
  className,
}: DoctorPerformanceTableProps) {
  const totals = rows.reduce(
    (acc, r) => ({
      processing: acc.processing + r.processing,
      resolved: acc.resolved + r.resolved,
      escalated: acc.escalated + r.escalated,
      aiFallback: acc.aiFallback + r.aiFallback,
    }),
    { processing: 0, resolved: 0, escalated: 0, aiFallback: 0 },
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Hiệu suất bác sĩ</CardTitle>
        <CardDescription>
          Theo dõi số vé đã xử lý, đang xử lý, đã chuyển cấp và mức hài lòng
          theo bác sĩ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bác sĩ</TableHead>
                <TableHead className="text-right">Đang xử lý</TableHead>
                <TableHead className="text-right">Đã xử lý</TableHead>
                {!hideEscalated && <TableHead className="text-right">Đã chuyển cấp</TableHead>}
                <TableHead className="text-right">AI hỗ trợ</TableHead>
                <TableHead className="text-right">TG xử lý TB</TableHead>
                <TableHead className="text-right">Hài lòng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.doctorId}>
                  <TableCell className="font-medium">{row.doctor}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.processing}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.resolved}
                  </TableCell>
                  {!hideEscalated && (
                    <TableCell className="text-right tabular-nums">
                      {row.escalated}
                    </TableCell>
                  )}
                  <TableCell className="text-right tabular-nums">
                    {row.aiFallback}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.avgResolutionHours != null ? `${row.avgResolutionHours}h` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.satisfaction != null ? `${row.satisfaction.toFixed(1)} / 5` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell>Tổng</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.processing}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.resolved}
                </TableCell>
                {!hideEscalated && (
                  <TableCell className="text-right tabular-nums">
                    {totals.escalated}
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">
                  {totals.aiFallback}
                </TableCell>
                <TableCell className="text-right tabular-nums">—</TableCell>
                <TableCell className="text-right tabular-nums">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default DoctorPerformanceTable;
