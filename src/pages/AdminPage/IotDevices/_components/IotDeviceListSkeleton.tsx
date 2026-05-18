import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface Props {
  rows?: number;
}

export function IotDeviceListSkeleton({ rows = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="w-30">
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell className="min-w-55">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-3 w-28" />
          </TableCell>
          <TableCell className="w-14 text-right">
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
