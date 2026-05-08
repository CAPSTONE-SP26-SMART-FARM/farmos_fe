import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import useDebounce from "@/hooks/useDebounce";
import { isApiErrorResponse } from "@/lib/utils";
import {
  useOwnerListZoneManagers,
  useOwnerRemoveZoneManager,
} from "@/queries/useZone";
import type { ZoneManagerWithUserResType } from "@/schemaValidatation/zoneMember";
import { format } from "date-fns";
import {
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  zoneId: string;
  onAssignSingle: () => void;
}

const USER_STATUS_LABELS: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
};

export default function ZoneManagersSection({
  zoneId,
  onAssignSingle,
}: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);

  const query = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isError } = useOwnerListZoneManagers(zoneId, query);
  const managers = data?.data.data ?? [];
  const meta = data?.data.meta;

  useEffect(() => {
    if (isLoading || !meta) return;

    if (meta.totalPages > 0 && page > meta.totalPages) {
      setPage(meta.totalPages);
      return;
    }

    if (page > 1 && managers.length === 0) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  }, [isLoading, managers.length, meta, page]);

  const removeMutation = useOwnerRemoveZoneManager(zoneId);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (isApiErrorResponse(error)) {
      return error.response?.data.message ?? fallback;
    }
    return fallback;
  };

  const handleRemove = (manager: ZoneManagerWithUserResType) => {
    removeMutation.mutate(manager.managerId, {
      onSuccess: () => toast.success("Đã gỡ quản lý khỏi khu vực."),
      onError: (error) =>
        toast.error(getErrorMessage(error, "Không thể gỡ quản lý.")),
    });
  };

  const columns: ColumnDef<ZoneManagerWithUserResType>[] = [
    {
      id: "manager",
      header: "Quản lý",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.user.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.user.email}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.user.status === "ACTIVE" ? "default" : "secondary"
          }
          className="capitalize"
        >
          {USER_STATUS_LABELS[row.original.user.status.toLowerCase()] ??
            row.original.user.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      accessorKey: "assignedAt",
      header: "Ngày phân công",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.assignedAt), "dd/MM/yyyy")}
        </span>
      ),
    },
  ];

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Quản lý được phân công
          </h3>
          <p className="text-sm text-muted-foreground">
            Danh sách quản lý phụ trách khu vực này.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              className="pl-8 w-52"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            onClick={onAssignSingle}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Phân công
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isError ? (
          <CardContent className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Không tải được danh sách quản lý. Vui lòng thử lại.
            </p>
          </CardContent>
        ) : !isLoading && managers.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              Chưa có quản lý được phân công
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Hãy phân công quản lý cho khu vực này để theo dõi vận hành.
            </p>
            <Button
              onClick={onAssignSingle}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Phân công quản lý đầu tiên
            </Button>
          </CardContent>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={managers}
              isLoading={isLoading}
              actions={[
                {
                  key: "remove",
                  label: "Gỡ",
                  icon: Trash2,
                  variant: "destructive",
                  disabled: () => removeMutation.isPending,
                  onSelect: (m) => handleRemove(m),
                },
              ]}
              emptyText="Chưa có quản lý nào."
            />

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Trang {meta.page}/{meta.totalPages} &bull; {meta.totalItems}{" "}
                  quản lý
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
