import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableActionsCell } from "./DataTableActionsCell";
import { DataTableSkeleton } from "./DataTableSkeleton";
import type { DataTableAction } from "./types";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyText?: string;
  actions?: DataTableAction<TData>[];
  onRowClick?: (row: TData) => void;
  rowClassName?: string | ((row: TData) => string | undefined);
  pageSize?: number;
  className?: string;
}

const ACTIONS_COLUMN_ID = "__actions__";

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  emptyText = "Không có kết quả.",
  actions,
  onRowClick,
  rowClassName,
  pageSize = 10,
  className,
}: DataTableProps<TData>) {
  const finalColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!actions || actions.length === 0) return columns;
    const actionColumn: ColumnDef<TData, unknown> = {
      id: ACTIONS_COLUMN_ID,
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableActionsCell
            row={row.original}
            actions={actions}
          />
        </div>
      ),
    };
    return [...columns, actionColumn];
  }, [columns, actions]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    autoResetPageIndex: false,
  });

  const totalCols = finalColumns.length;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <DataTableSkeleton
              rows={pageSize}
              columns={totalCols}
            />
          ) : rows.length ? (
            rows.map((row) => {
              const rowClass =
                typeof rowClassName === "function"
                  ? rowClassName(row.original)
                  : rowClassName;
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    rowClass,
                  )}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={totalCols}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
