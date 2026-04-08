import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { UserResType } from "@/types/user";
import { RoleName } from "@/constants/role";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
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
import { useAdminListUsers } from "@/queries/useAdmin";
import type { ListUsersQueryType } from "@/schemaValidatation/user";

interface UserTableProps {
  onViewDetail: (id: string) => void;
}

const ROLE_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Admin", value: RoleName.Admin },
  { label: "Owner", value: RoleName.Owner },
  { label: "Manager", value: RoleName.Manager },
  { label: "Doctor", value: RoleName.Doctor },
  { label: "Farmer", value: RoleName.Farmer },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
];

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  owner: "secondary",
  manager: "outline",
  doctor: "outline",
  farmer: "outline",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

const UserTable = ({ onViewDetail }: UserTableProps) => {
  const [searchParam] = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const query: ListUsersQueryType = {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    role:
      roleFilter !== "all"
        ? (roleFilter as ListUsersQueryType["role"])
        : undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as ListUsersQueryType["status"])
        : undefined,
  };

  const listResult = useAdminListUsers(query);

  const data: UserResType[] = listResult.data?.data.data ?? [];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  const columns: ColumnDef<UserResType>[] = [
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullName")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge
            variant={roleVariant[role] ?? "outline"}
            className="capitalize"
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={statusVariant[status] ?? "outline"}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <div>{(row.getValue("phone") as string | null) ?? "—"}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
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

  const [pagination, setPagination] = useState({ pageIndex, pageSize: 10 });

  useEffect(() => {
    setPagination({ pageIndex, pageSize: 10 });
  }, [pageIndex]);

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
    state: { pagination },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <div className="flex-1 text-xs text-muted-foreground">
          Showing <strong>{table.getPaginationRowModel().rows.length}</strong>{" "}
          of <strong>{totalRecords}</strong> results
        </div>
        {totalPages > 1 && (
          <ProPagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => {
              const params = new URLSearchParams(searchParam);
              if (p) params.set("page", String(p));
              else params.delete("page");
              return { pathname: location.pathname, search: params.toString() };
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UserTable;
