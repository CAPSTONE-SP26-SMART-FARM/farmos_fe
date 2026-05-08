import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import type { DoctorPerformanceRow } from "../_mocks/ticketAnalytics.mock";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface DoctorPerformanceTableProps {
  rows: DoctorPerformanceRow[];
  hideEscalated?: boolean;
  className?: string;
}

type Row = DoctorPerformanceRow & { __isTotal?: boolean };

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

  const data: Row[] = useMemo(
    () => [
      ...rows,
      {
        doctorId: "__total__",
        doctor: "Tổng",
        processing: totals.processing,
        resolved: totals.resolved,
        escalated: totals.escalated,
        aiFallback: totals.aiFallback,
        avgResolutionHours: null,
        satisfaction: null,
        __isTotal: true,
      } as Row,
    ],
    [
      rows,
      totals.processing,
      totals.resolved,
      totals.escalated,
      totals.aiFallback,
    ],
  );

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const cols: ColumnDef<Row>[] = [
      {
        accessorKey: "doctor",
        header: "Bác sĩ",
        cell: ({ row }) => (
          <span
            className={
              row.original.__isTotal ? "font-semibold" : "font-medium"
            }
          >
            {row.original.doctor}
          </span>
        ),
      },
      {
        accessorKey: "processing",
        header: () => <div className="text-right">Đang xử lý</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.processing}
          </div>
        ),
      },
      {
        accessorKey: "resolved",
        header: () => <div className="text-right">Đã xử lý</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.resolved}
          </div>
        ),
      },
    ];

    if (!hideEscalated) {
      cols.push({
        accessorKey: "escalated",
        header: () => <div className="text-right">Đã chuyển cấp</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.escalated}
          </div>
        ),
      });
    }

    cols.push(
      {
        accessorKey: "aiFallback",
        header: () => <div className="text-right">AI hỗ trợ</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.aiFallback}
          </div>
        ),
      },
      {
        accessorKey: "avgResolutionHours",
        header: () => <div className="text-right">TG xử lý TB</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.__isTotal
              ? "—"
              : row.original.avgResolutionHours != null
                ? `${row.original.avgResolutionHours}h`
                : "—"}
          </div>
        ),
      },
      {
        accessorKey: "satisfaction",
        header: () => <div className="text-right">Hài lòng</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.__isTotal
              ? "—"
              : row.original.satisfaction != null
                ? `${row.original.satisfaction.toFixed(1)} / 5`
                : "—"}
          </div>
        ),
      },
    );

    return cols;
  }, [hideEscalated]);

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
          <DataTable
            columns={columns}
            data={data}
            rowClassName={(row) =>
              row.__isTotal ? "bg-muted/40 font-semibold" : undefined
            }
            emptyText="Không có dữ liệu."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default DoctorPerformanceTable;
