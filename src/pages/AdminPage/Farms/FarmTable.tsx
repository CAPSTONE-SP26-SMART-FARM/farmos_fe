import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { FarmWithOwnerResType } from "@/schemaValidatation/farmManagement";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProPagination from "@/components/common/pro-pagination";
import useDebounce from "@/hooks/useDebounce";
import TableSkeleton from "@/components/common/TableSkeleton";
import { useAdminListFarms } from "@/queries/useAdmin";

interface FarmTableProps {
  onViewDetail: (id: string) => void;
}

const FarmTable = ({ onViewDetail }: FarmTableProps) => {
  const [searchParam] = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const listResult = useAdminListFarms({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const data: FarmWithOwnerResType[] = listResult.data?.data.data ?? [];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  const columns: ColumnDef<FarmWithOwnerResType>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "farmType",
      header: "Type",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("farmType")}</div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <div>{row.getValue("address") ?? "—"}</div>,
    },
    {
      accessorKey: "areaHectares",
      header: "Area (ha)",
      cell: ({ row }) => <div>{row.getValue("areaHectares") ?? "—"}</div>,
    },
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }) => (
        <div>{row.original.owner.fullName ?? row.original.owner.email}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div>
          {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(row.original.id)}
        >
          <Info className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination({ pageIndex, pageSize: 10 });
  }, [pageIndex]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (page > 1 && debouncedSearch) {
      const params = new URLSearchParams(searchParam);
      params.set("page", "1");
      window.history.replaceState(
        {},
        "",
        `${location.pathname}?${params.toString()}`,
      );
    }
  }, [debouncedSearch, page, searchParam]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    manualPagination: true,
    autoResetPageIndex: false,
    pageCount: totalPages,
    state: {
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Search farms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
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
            {listResult.isLoading && <TableSkeleton />}
            {!listResult.isLoading && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !listResult.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-xs text-muted-foreground py-4 flex-1">
          Showing <strong>{table.getPaginationRowModel().rows.length}</strong>{" "}
          of <strong>{totalRecords}</strong> results
        </div>
        {totalPages > 1 && (
          <div>
            <ProPagination
              currentPage={page}
              totalPages={totalPages}
              buildHref={(p: number | null | undefined) => {
                const params = new URLSearchParams(searchParam);
                if (p) {
                  params.set("page", String(p));
                } else {
                  params.delete("page");
                }
                return {
                  pathname: location.pathname,
                  search: params.toString(),
                };
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmTable;
