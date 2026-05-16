import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/DataTable";
import useDebounce from "@/hooks/useDebounce";
import { useOwnerListFarmMembers } from "@/queries/useOwner";
import {
  useOwnerListZones,
  useOwnerSoftDeleteFarmStaffUser,
} from "@/queries/useZone";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import type { ListZonesQueryType } from "@/types/zone";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Eye,
  Loader2,
  Search,
  Tractor,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import type { DataTableAction } from "@/components/common/DataTable/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getRoleLabelVi, RoleName } from "@/constants/role";
import { isApiErrorResponse } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  farmId: string;
  onAddMember: () => void;
  onViewMember: (member: FarmMemberResType) => void;
}

const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: RoleName.Manager, label: "Quản lý" },
  { value: RoleName.Farmer, label: "Nông dân" },
] as const;

const ZONES_LIST_QUERY: ListZonesQueryType = { page: 1, limit: 100 };

const RoleIcon = ({ role }: { role: string }) =>
  role === RoleName.Manager ? (
    <UserCog className="h-4 w-4 text-blue-600" />
  ) : (
    <Tractor className="h-4 w-4 text-green-600" />
  );

const MemberListSection = ({ farmId, onAddMember, onViewMember }: Props) => {
  const [roleFilter, setRoleFilter] = useState<"all" | "farmer" | "manager">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(search, 500);
  const [deleteTarget, setDeleteTarget] = useState<FarmMemberResType | null>(
    null,
  );
  const currentUserId = useAuthStore((state) => state.user?.id);

  const query = {
    page,
    limit,
    farmId,
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, isError } = useOwnerListFarmMembers(query);
  const members = data?.data.data ?? [];
  const meta = data?.data.meta;

  const zonesQuery = useOwnerListZones(farmId, ZONES_LIST_QUERY);
  const zones = zonesQuery.data?.data?.data ?? [];

  const { mutateAsync: softDeleteMember, isPending: deleting } =
    useOwnerSoftDeleteFarmStaffUser();

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as "all" | "farmer" | "manager");
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const zoneId = zones[0]?.id;
    if (!zoneId) {
      toast.error(
        "Thêm ít nhất một khu vực (zone) vào nông trại để có thể gỡ tài khoản.",
      );
      return;
    }
    try {
      await softDeleteMember({
        zoneId,
        userId: deleteTarget.user.id,
        farmMemberId: deleteTarget.id,
      });
      toast.success("Đã gỡ tài khoản khỏi hệ thống");
      setDeleteTarget(null);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Không thể gỡ tài khoản này.",
        );
        return;
      }
      toast.error("Không thể gỡ tài khoản. Vui lòng thử lại.");
    }
  };

  const columns = useMemo<ColumnDef<FarmMemberResType>[]>(
    () => [
      {
        id: "user",
        header: "Tài khoản",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <RoleIcon role={row.original.role} />
            <div>
              <p className="font-medium">{row.original.user.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.user.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        cell: ({ row }) => (
          <Badge variant="secondary">{getRoleLabelVi(row.original.role)}</Badge>
        ),
      },
      {
        id: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.user.phone ?? "—"}</span>
        ),
      },
      {
        id: "farm",
        header: "Nông trại",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.farm.name}</span>
        ),
      },
      {
        accessorKey: "assignedAt",
        header: "Ngày gán",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {format(new Date(row.original.assignedAt), "dd/MM/yyyy")}
          </span>
        ),
      },
    ],
    [],
  );

  const tableActions = useMemo<DataTableAction<FarmMemberResType>[]>(
    () => [
      {
        key: "view",
        label: "Xem",
        icon: Eye,
        onSelect: (member) => onViewMember(member),
      },
      {
        key: "delete",
        label: "Gỡ tài khoản",
        icon: Trash2,
        variant: "destructive",
        disabled: () => deleting,
        hidden: (member) => member.user.id === currentUserId,
        onSelect: (member) => setDeleteTarget(member),
      },
    ],
    [currentUserId, deleting, onViewMember],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <p className="text-sm text-muted-foreground">
            Xem và quản lý tài khoản của nông trại.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo email hoặc số điện thoại..."
              className="pl-8 w-56"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
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
          <Button
            onClick={onAddMember}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Không tải được danh sách tài khoản. Vui lòng thử lại.
            </p>
          </CardContent>
        </Card>
      ) : !isLoading && members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Chưa có tài khoản</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Hãy thêm tài khoản để hỗ trợ vận hành nông trại hàng ngày.
            </p>
            <Button
              onClick={onAddMember}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              Thêm tài khoản đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <DataTable
              columns={columns}
              data={members}
              isLoading={isLoading}
              actions={tableActions}
              onRowClick={(member) => onViewMember(member)}
              emptyText="Chưa có tài khoản nào."
            />
          </Card>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Trang {meta.page}/{meta.totalPages} &bull; {meta.totalItems} tài
                khoản
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}
      >
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Gỡ tài khoản?</DialogTitle>
            <DialogDescription>
              Tài khoản <strong>{deleteTarget?.user.fullName}</strong> sẽ bị vô
              hiệu hoá và không đăng nhập được nữa. Thao tác này dựa trên API
              xóa mềm theo khu vực của nông trại.
            </DialogDescription>
          </DialogHeader>
          {zonesQuery.isFetching && zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Đang kiểm tra khu vực…
            </p>
          ) : zones.length === 0 ? (
            <p className="text-sm text-destructive">
              Nông trại chưa có khu vực (zone). Hãy tạo một khu vực trước khi gỡ
              tài khoản.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting || zonesQuery.isFetching || zones.length === 0}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Gỡ tài khoản"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberListSection;
