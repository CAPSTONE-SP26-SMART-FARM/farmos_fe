import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface DataTableSkeletonProps {
  rows?: number;
  columns: number;
}

export function DataTableSkeleton({
  rows = 8,
  columns,
}: DataTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: columns }).map((__, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default DataTableSkeleton;
